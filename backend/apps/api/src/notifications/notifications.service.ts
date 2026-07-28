import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationEntity } from 'app/database';
import { NotificationStatus, RouterMessage, routeKey } from 'app/domain';
import { MessagingService } from 'app/messaging';
import { Repository } from 'typeorm';
import { DispatchNotificationDto } from './dto/dispatch-notification.dto';
import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity) private readonly repo: Repository<NotificationEntity>,
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * The one real implementation behind all three admin endpoints (send / send-bulk /
   * broadcast) — see docs/05-api-design.md. For each target user: persist a `notifications`
   * row, then publish once to `router.queue` (not per-channel — the router worker resolves
   * enabled channels from preferences, see docs/08-notification-flow.md).
   */
  async dispatch(userIds: string[], dto: DispatchNotificationDto): Promise<{ notificationIds: string[] }> {
    const notificationIds: string[] = [];

    for (const userId of userIds) {
      const notification = await this.repo.save(
        this.repo.create({
          userId,
          title: dto.title,
          body: dto.body,
          category: dto.category,
          data: dto.data ?? null,
          status: NotificationStatus.PENDING,
        }),
      );

      const message: RouterMessage = {
        notificationId: notification.id,
        userId,
        category: dto.category,
        title: dto.title,
        body: dto.body,
        data: dto.data,
      };
      await this.messagingService.publish(routeKey(dto.category), message);

      notification.status = NotificationStatus.QUEUED;
      await this.repo.save(notification);
      notificationIds.push(notification.id);
    }

    return { notificationIds };
  }

  async listForUser(userId: string, query: ListNotificationsQueryDto) {
    const where: Record<string, unknown> = { userId };
    if (query.isRead !== undefined) where.isRead = query.isRead === 'true';

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    });

    return { items, total, page: query.page, limit: query.limit };
  }

  async findOneForUser(userId: string, id: string): Promise<NotificationEntity> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException();
    return notification;
  }

  async markRead(userId: string, id: string): Promise<NotificationEntity> {
    const notification = await this.findOneForUser(userId, id);
    notification.isRead = true;
    return this.repo.save(notification);
  }

  async remove(userId: string, id: string): Promise<void> {
    const notification = await this.findOneForUser(userId, id);
    await this.repo.remove(notification);
  }
}
