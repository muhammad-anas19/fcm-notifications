import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeviceTokensQueryService, NotificationDeliveryLogEntity } from 'app/database';
import {
  CHANNEL_QUEUE,
  ChannelMessage,
  DeliveryStatus,
  NotificationChannel,
  PUSH_PROVIDER,
  type PushProvider,
} from 'app/domain';
import { MessagingService } from 'app/messaging';
import { Repository } from 'typeorm';

/**
 * Consumes `push.queue`. For every registered active device token belonging to the target
 * user, calls FCM. See docs/07-fcm-complete-guide.md for the notification-vs-data payload
 * split and token invalidation, docs/09-retries-and-dlq.md for the idempotency check below.
 */
@Injectable()
export class PushWorkerService implements OnModuleInit {
  private readonly logger = new Logger(PushWorkerService.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly deviceTokensQueryService: DeviceTokensQueryService,
    @Inject(PUSH_PROVIDER) private readonly pushProvider: PushProvider,
    @InjectRepository(NotificationDeliveryLogEntity) private readonly deliveryLogs: Repository<NotificationDeliveryLogEntity>,
  ) {}

  async onModuleInit() {
    await this.messagingService.consume(CHANNEL_QUEUE[NotificationChannel.PUSH], 1, (payload, raw) =>
      this.handle(payload, raw),
    );
  }

  private async handle(payload: ChannelMessage, raw: import('amqplib').ConsumeMessage): Promise<void> {
    // At-least-once delivery means this exact message can arrive twice (docs/02, docs/09) — if
    // we already recorded a terminal outcome for this (notification, channel) pair, skip
    // re-sending and just ack.
    const existing = await this.deliveryLogs.findOne({
      where: { notificationId: payload.notificationId, channel: NotificationChannel.PUSH },
    });
    if (existing && (existing.status === DeliveryStatus.SENT || existing.status === DeliveryStatus.DELIVERED)) {
      this.logger.log(`Notification ${payload.notificationId} already sent to push — skipping duplicate delivery`);
      return;
    }

    const log =
      existing ??
      (await this.deliveryLogs.save(
        this.deliveryLogs.create({
          notificationId: payload.notificationId,
          channel: NotificationChannel.PUSH,
          status: DeliveryStatus.QUEUED,
          attemptCount: 0,
        }),
      ));

    try {
      const tokens = await this.deviceTokensQueryService.listActiveForUser(payload.userId);
      if (tokens.length === 0) {
        this.logger.warn(`User ${payload.userId} has no active device tokens — nothing to push`);
        log.status = DeliveryStatus.FAILED;
        log.errorMessage = 'No active device tokens';
        await this.deliveryLogs.save(log);
        return;
      }

      let anySucceeded = false;
      for (const token of tokens) {
        const result = await this.pushProvider.send(token.fcmToken, payload.title, payload.body, payload.data);
        if (result.success) {
          anySucceeded = true;
          log.providerMessageId = result.providerMessageId ?? null;
        } else if (result.invalidToken) {
          await this.deviceTokensQueryService.deactivate(token.fcmToken);
        } else {
          log.errorMessage = result.errorMessage ?? null;
        }
      }

      log.attemptCount += 1;
      log.status = anySucceeded ? DeliveryStatus.SENT : DeliveryStatus.FAILED;
      await this.deliveryLogs.save(log);

      if (!anySucceeded) {
        await this.retry(payload, raw, log);
      }
    } catch (err) {
      log.errorMessage = (err as Error).message;
      await this.deliveryLogs.save(log);
      await this.retry(payload, raw, log);
    }
  }

  private async retry(
    payload: ChannelMessage,
    raw: import('amqplib').ConsumeMessage,
    log: NotificationDeliveryLogEntity,
  ): Promise<void> {
    const outcome = await this.messagingService.retryOrDeadLetter(NotificationChannel.PUSH, payload, raw);
    log.status = outcome === 'retried' ? DeliveryStatus.RETRYING : DeliveryStatus.DEAD_LETTERED;
    await this.deliveryLogs.save(log);
  }
}
