import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationDeliveryLogEntity } from 'app/database';
import { CHANNEL_QUEUE, ChannelMessage, DeliveryStatus, NotificationChannel } from 'app/domain';
import { MessagingService } from 'app/messaging';
import { Repository } from 'typeorm';

/**
 * Consumes `inapp.queue`. The simplest worker in the system: the `notifications` row already
 * exists (the API wrote it before publishing at all), so "delivering" an in-app notification
 * means nothing more than recording that this channel's delivery succeeded — there's no
 * external provider to call, which is exactly why this worker has no retry-worthy failure mode
 * in practice (see docs/06-background-jobs-and-workers.md).
 */
@Injectable()
export class InappWorkerService implements OnModuleInit {
  private readonly logger = new Logger(InappWorkerService.name);

  constructor(
    private readonly messagingService: MessagingService,
    @InjectRepository(NotificationDeliveryLogEntity) private readonly deliveryLogs: Repository<NotificationDeliveryLogEntity>,
  ) {}

  async onModuleInit() {
    await this.messagingService.consume(CHANNEL_QUEUE[NotificationChannel.INAPP], 1, (payload) => this.handle(payload));
  }

  private async handle(payload: ChannelMessage): Promise<void> {
    const existing = await this.deliveryLogs.findOne({
      where: { notificationId: payload.notificationId, channel: NotificationChannel.INAPP },
    });
    if (existing) {
      this.logger.log(`Notification ${payload.notificationId} already delivered in-app — skipping duplicate`);
      return;
    }

    await this.deliveryLogs.save(
      this.deliveryLogs.create({
        notificationId: payload.notificationId,
        channel: NotificationChannel.INAPP,
        status: DeliveryStatus.DELIVERED,
        attemptCount: 1,
      }),
    );
  }
}
