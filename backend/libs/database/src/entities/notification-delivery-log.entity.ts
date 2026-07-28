import { DeliveryStatus, NotificationChannel } from 'app/domain';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Entity('notification_delivery_logs')
@Index('idx_delivery_logs_notification_channel', ['notificationId', 'channel'])
export class NotificationDeliveryLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  notificationId: string;

  @ManyToOne(() => NotificationEntity, { onDelete: 'CASCADE' })
  notification: NotificationEntity;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: DeliveryStatus, default: DeliveryStatus.QUEUED })
  status: DeliveryStatus;

  @Column({ type: 'varchar', nullable: true })
  providerMessageId: string | null;

  @Column({ nullable: true, type: 'text' })
  errorMessage: string | null;

  @Column({ default: 0 })
  attemptCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
