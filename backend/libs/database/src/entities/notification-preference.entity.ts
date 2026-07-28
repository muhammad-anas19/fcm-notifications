import { NotificationCategory, NotificationChannel } from 'app/domain';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('notification_preferences')
@Unique('uq_preference_user_channel_category', ['userId', 'channel', 'category'])
export class NotificationPreferenceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ type: 'enum', enum: NotificationCategory })
  category: NotificationCategory;

  @Column({ default: true })
  enabled: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
