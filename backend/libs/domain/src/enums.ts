export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum DevicePlatform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum NotificationChannel {
  PUSH = 'push',
  EMAIL = 'email',
  SMS = 'sms',
  INAPP = 'inapp',
  WHATSAPP = 'whatsapp',
}

export enum NotificationCategory {
  TRANSACTIONAL = 'transactional',
  PROMOTIONAL = 'promotional',
}

export enum NotificationStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  SENT = 'sent',
  FAILED = 'failed',
}

export enum DeliveryStatus {
  QUEUED = 'queued',
  SENT = 'sent',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETRYING = 'retrying',
  DEAD_LETTERED = 'dead_lettered',
}

export enum QueueLogEvent {
  PUBLISHED = 'published',
  CONSUMED = 'consumed',
  ACKED = 'acked',
  NACKED = 'nacked',
  DEAD_LETTERED = 'dead_lettered',
}

/** Channels that are fully implemented in this project. Others exist in the schema/enum as
 * placeholders so adding them later is a config change, not a redesign — see docs/15. */
export const IMPLEMENTED_CHANNELS: NotificationChannel[] = [
  NotificationChannel.PUSH,
  NotificationChannel.INAPP,
];
