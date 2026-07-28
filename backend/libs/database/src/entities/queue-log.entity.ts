import { QueueLogEvent } from 'app/domain';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/** Optional/debug table — see docs/04-database-design.md. First thing to sample/drop under
 * real production volume; kept unconditionally in this learning project because tracing
 * "what happened to this message" is the whole point of building it once. */
@Entity('queue_logs')
export class QueueLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  messageId: string;

  @Column()
  exchange: string;

  @Column()
  routingKey: string;

  @Column()
  queueName: string;

  @Column({ type: 'enum', enum: QueueLogEvent })
  event: QueueLogEvent;

  @Column({ type: 'jsonb', nullable: true })
  payloadSnapshot: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
