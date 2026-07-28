import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity, PreferencesQueryService } from 'app/database';
import { ChannelMessage, NotificationStatus, ROUTER_QUEUE, RouterMessage, channelRoutingKey } from 'app/domain';
import { MessagingService } from 'app/messaging';
import { Repository } from 'typeorm';

/**
 * Consumes `router.queue` — one message per (notification, user) published by the API. Its
 * only job is: load this user's enabled channels for this category, then republish once per
 * enabled channel. See docs/08-notification-flow.md for why this exists as its own stage
 * instead of the API deciding channels itself (preferences require a DB read the API
 * shouldn't block a response on).
 */
@Injectable()
export class RouterWorkerService implements OnModuleInit {
  private readonly logger = new Logger(RouterWorkerService.name);

  constructor(
    private readonly messagingService: MessagingService,
    private readonly preferencesQueryService: PreferencesQueryService,
    @InjectRepository(NotificationEntity) private readonly notifications: Repository<NotificationEntity>,
  ) {}

  async onModuleInit() {
    await this.messagingService.consume(ROUTER_QUEUE, 1, (payload, raw) => this.handle(payload, raw));
  }

  private async handle(payload: RouterMessage, raw: import('amqplib').ConsumeMessage): Promise<void> {
    try {
      const enabledChannels = await this.preferencesQueryService.getEnabledChannels(payload.userId, payload.category);

      for (const channel of enabledChannels) {
        const message: ChannelMessage = {
          notificationId: payload.notificationId,
          userId: payload.userId,
          channel,
          category: payload.category,
          title: payload.title,
          body: payload.body,
          data: payload.data,
        };
        await this.messagingService.publish(channelRoutingKey(channel, payload.category), message);
      }

      await this.notifications.update(payload.notificationId, { status: NotificationStatus.PROCESSING });
    } catch (err) {
      this.logger.warn(`Routing failed for notification ${payload.notificationId}: ${(err as Error).message}`);
      const outcome = await this.messagingService.retryOrDeadLetter('route', payload, raw);
      if (outcome === 'dead_lettered') {
        await this.notifications.update(payload.notificationId, { status: NotificationStatus.FAILED });
      }
    }
  }
}
