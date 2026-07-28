import { NotificationCategory, NotificationChannel } from 'app/domain';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('notification_templates')
export class NotificationTemplateEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column()
  titleTemplate: string;

  @Column()
  bodyTemplate: string;

  @Column({ type: 'enum', enum: NotificationCategory })
  category: NotificationCategory;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  defaultChannels: NotificationChannel[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
