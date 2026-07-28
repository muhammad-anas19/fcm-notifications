import { NotificationCategory, NotificationStatus } from 'app/domain';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { NotificationTemplateEntity } from './notification-template.entity';
import { UserEntity } from './user.entity';

@Entity('notifications')
@Index('idx_notifications_user_created', ['userId', 'createdAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @ManyToOne(() => UserEntity, { nullable: true, onDelete: 'CASCADE' })
  user: UserEntity | null;

  @Column({ type: 'uuid', nullable: true })
  templateId: string | null;

  @ManyToOne(() => NotificationTemplateEntity, { nullable: true })
  template: NotificationTemplateEntity | null;

  @Column()
  title: string;

  @Column()
  body: string;

  @Column({ type: 'enum', enum: NotificationCategory })
  category: NotificationCategory;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'enum', enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Column({ default: false })
  isRead: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
