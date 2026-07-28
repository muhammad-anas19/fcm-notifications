import { DevicePlatform } from 'app/domain';
import { Column, CreateDateColumn, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('device_tokens')
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;

  @Column({ unique: true })
  fcmToken: string;

  @Column({ type: 'enum', enum: DevicePlatform })
  platform: DevicePlatform;

  @Index()
  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
