import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'app/common';
import { DatabaseModule, NotificationDeliveryLogEntity } from 'app/database';
import { MessagingModule } from 'app/messaging';
import { ProvidersModule } from 'app/providers';
import { PushWorkerService } from './push-worker.service';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    TypeOrmModule.forFeature([NotificationDeliveryLogEntity]),
    MessagingModule,
    ProvidersModule,
  ],
  providers: [PushWorkerService],
})
export class PushWorkerModule {}
