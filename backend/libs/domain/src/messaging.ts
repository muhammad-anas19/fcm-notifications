import { NotificationCategory, NotificationChannel } from './enums';

/** Canonical messaging topology — see docs/02-rabbitmq-fundamentals.md and docs/08-notification-flow.md.
 * Every app (api, router-worker, push-worker, inapp-worker) imports these constants instead of
 * hardcoding strings, so the topology can only be defined in one place. */

export const NOTIFICATIONS_EXCHANGE = 'notifications.topic';

export const ROUTER_QUEUE = 'router.queue';

export const CHANNEL_QUEUE: Record<NotificationChannel, string> = {
  [NotificationChannel.PUSH]: 'push.queue',
  [NotificationChannel.EMAIL]: 'email.queue',
  [NotificationChannel.SMS]: 'sms.queue',
  [NotificationChannel.INAPP]: 'inapp.queue',
  [NotificationChannel.WHATSAPP]: 'whatsapp.queue',
};

export const FAILED_QUEUE = 'failed.queue';

/** Retry backoff tiers in milliseconds, applied in order as `x-retry-count` increases —
 * see docs/09-retries-and-dlq.md. */
export const RETRY_TTL_MS_BY_ATTEMPT: number[] = [30_000, 120_000, 600_000, 3_600_000];
export const MAX_RETRY_ATTEMPTS = RETRY_TTL_MS_BY_ATTEMPT.length;

/** A queue that can retry: every channel queue, plus the router queue (identified by 'route'). */
export type RetryableQueueKey = NotificationChannel | 'route';

/**
 * Retry queues are scoped per channel (not shared), because RabbitMQ dead-letters a message
 * using a routing key that must match the *original* queue's binding pattern on
 * `notifications.topic` — a shared generic retry queue couldn't route back to the right
 * channel. See docs/09-retries-and-dlq.md for the full explanation.
 */
export function retryQueueName(key: RetryableQueueKey, attempt: number): string {
  return `${key}.retry.queue.${attempt}`;
}

/** The routing key a retry queue dead-letters with once its TTL expires — just needs to match
 * the target channel's `notification.<channel>.#` binding pattern (or the router's
 * `notification.route.#`); the real category/payload travels in the message body, not here. */
export function retryDeadLetterRoutingKey(key: RetryableQueueKey): string {
  return key === 'route' ? 'notification.route.retry' : `notification.${key}.retry`;
}

/** The API publishes here — it does not yet know which channels are enabled for the user;
 * that's the router worker's job (see docs/08-notification-flow.md). */
export function routeKey(category: NotificationCategory): string {
  return `notification.route.${category}`;
}

/** The router worker republishes with this key once per enabled channel. */
export function channelRoutingKey(channel: NotificationChannel, category: NotificationCategory): string {
  return `notification.${channel}.${category}`;
}

export const ROUTER_BINDING_PATTERN = 'notification.route.#';

export function channelBindingPattern(channel: NotificationChannel): string {
  return `notification.${channel}.#`;
}

/** Message body published to `router.queue`: one per (notification, user). */
export interface RouterMessage {
  notificationId: string;
  userId: string;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

/** Message body published to a channel queue after the router resolves enabled channels. */
export interface ChannelMessage {
  notificationId: string;
  userId: string;
  channel: NotificationChannel;
  category: NotificationCategory;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}
