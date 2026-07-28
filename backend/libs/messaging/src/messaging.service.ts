import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHANNEL_QUEUE,
  channelBindingPattern,
  FAILED_QUEUE,
  MAX_RETRY_ATTEMPTS,
  NOTIFICATIONS_EXCHANGE,
  NotificationChannel,
  RETRY_TTL_MS_BY_ATTEMPT,
  retryDeadLetterRoutingKey,
  RetryableQueueKey,
  retryQueueName,
  ROUTER_BINDING_PATTERN,
  ROUTER_QUEUE,
} from 'app/domain';
import * as amqp from 'amqp-connection-manager';
import type { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import type { ConfirmChannel, ConsumeMessage } from 'amqplib';

export const RETRY_COUNT_HEADER = 'x-retry-count';

export type MessageHandler = (payload: any, raw: ConsumeMessage) => Promise<void>;

/**
 * Owns the one AMQP connection + channel for this process and the full topology declaration
 * (exchange, router queue, channel queues, retry tiers, terminal DLQ) — see
 * docs/02-rabbitmq-fundamentals.md and docs/09-retries-and-dlq.md. Every app (api,
 * router-worker, push-worker, inapp-worker) imports this same service so the topology is
 * defined in exactly one place and can only drift if this file changes.
 */
@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MessagingService.name);
  private connection: AmqpConnectionManager;
  private channelWrapper: ChannelWrapper;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL');
    if (!url) throw new Error('RABBITMQ_URL is not set');
    this.connection = amqp.connect([url]);
    this.connection.on('connect', () => this.logger.log('Connected to RabbitMQ'));
    this.connection.on('disconnect', ({ err }) =>
      this.logger.warn(`Disconnected from RabbitMQ, retrying: ${err?.message}`),
    );

    this.channelWrapper = this.connection.createChannel({
      json: true,
      setup: (channel: ConfirmChannel) => this.assertTopology(channel),
    });

    await this.channelWrapper.waitForConnect();
  }

  async onModuleDestroy() {
    await this.channelWrapper?.close();
    await this.connection?.close();
  }

  private async assertTopology(channel: ConfirmChannel): Promise<void> {
    await channel.assertExchange(NOTIFICATIONS_EXCHANGE, 'topic', { durable: true });

    await channel.assertQueue(ROUTER_QUEUE, { durable: true });
    await channel.bindQueue(ROUTER_QUEUE, NOTIFICATIONS_EXCHANGE, ROUTER_BINDING_PATTERN);
    await this.assertRetryTiers(channel, 'route');

    for (const ch of Object.values(NotificationChannel)) {
      const queueName = CHANNEL_QUEUE[ch];
      await channel.assertQueue(queueName, { durable: true });
      await channel.bindQueue(queueName, NOTIFICATIONS_EXCHANGE, channelBindingPattern(ch));
      await this.assertRetryTiers(channel, ch);
    }

    // Terminal DLQ — nothing auto-consumes this; a human or an alert investigates
    // (docs/09-retries-and-dlq.md, docs/12-monitoring.md).
    await channel.assertQueue(FAILED_QUEUE, { durable: true });
  }

  private async assertRetryTiers(channel: ConfirmChannel, key: RetryableQueueKey): Promise<void> {
    for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
      await channel.assertQueue(retryQueueName(key, attempt), {
        durable: true,
        arguments: {
          'x-message-ttl': RETRY_TTL_MS_BY_ATTEMPT[attempt],
          'x-dead-letter-exchange': NOTIFICATIONS_EXCHANGE,
          'x-dead-letter-routing-key': retryDeadLetterRoutingKey(key),
        },
      });
    }
  }

  /** Publish a brand-new message through the topic exchange with a routing key — what the API
   * and router worker do (see docs/08-notification-flow.md). */
  async publish(routingKey: string, message: object, headers: Record<string, unknown> = {}): Promise<void> {
    await this.channelWrapper.publish(NOTIFICATIONS_EXCHANGE, routingKey, message, {
      persistent: true,
      headers,
    });
  }

  /** Publish straight into a named queue via the default exchange — used only for retry tiers
   * and the terminal failed queue, where the destination is already known and topic routing
   * isn't needed. */
  private async publishToQueue(
    queueName: string,
    message: object,
    headers: Record<string, unknown> = {},
  ): Promise<void> {
    await this.channelWrapper.sendToQueue(queueName, message, { persistent: true, headers });
  }

  /**
   * Called by a worker when processing a message fails. Reads `x-retry-count` off the
   * message, and either bumps it into the next backoff tier or — past MAX_RETRY_ATTEMPTS —
   * routes it to the terminal `failed.queue`. See docs/09-retries-and-dlq.md. The caller still
   * acks the *original* delivery itself; this only places the *next* copy.
   */
  async retryOrDeadLetter(
    key: RetryableQueueKey,
    payload: object,
    raw: ConsumeMessage,
  ): Promise<'retried' | 'dead_lettered'> {
    const currentAttempt = Number(raw.properties.headers?.[RETRY_COUNT_HEADER] ?? 0);
    if (currentAttempt >= MAX_RETRY_ATTEMPTS) {
      await this.publishToQueue(FAILED_QUEUE, payload, raw.properties.headers);
      return 'dead_lettered';
    }
    await this.publishToQueue(retryQueueName(key, currentAttempt), payload, {
      ...raw.properties.headers,
      [RETRY_COUNT_HEADER]: currentAttempt + 1,
    });
    return 'retried';
  }

  /**
   * Subscribe to a queue with a fixed prefetch — this is what makes running N worker instances
   * load-balance a queue instead of one instance hoarding messages (docs/02, docs/06).
   *
   * `handler` is expected to catch its own delivery failures and call `retryOrDeadLetter`
   * itself, then resolve normally — at that point this wrapper always acks the original
   * delivery, since the retry/DLQ copy has already been placed. If `handler` throws anyway
   * (a genuine bug, not a normal delivery failure), the message is nacked without requeue as a
   * last resort so a broken handler can't spin the same message forever.
   */
  async consume(queueName: string, prefetch: number, handler: MessageHandler): Promise<void> {
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.prefetch(prefetch);
      await channel.consume(queueName, async (msg) => {
        if (!msg) return;
        try {
          const payload = JSON.parse(msg.content.toString());
          await handler(payload, msg);
          channel.ack(msg);
        } catch (err) {
          this.logger.error(`Unhandled error consuming ${queueName}: ${(err as Error).message}`, (err as Error).stack);
          channel.nack(msg, false, false);
        }
      });
    });
  }
}
