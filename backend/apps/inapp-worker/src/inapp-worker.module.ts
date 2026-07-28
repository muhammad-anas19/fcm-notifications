import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'app/common';
import { DatabaseModule, NotificationDeliveryLogEntity } from 'app/database';
import { MessagingModule } from 'app/messaging';
import { InappWorkerService } from './inapp-worker.service';

@Module({
  imports: [CommonModule, DatabaseModule, TypeOrmModule.forFeature([NotificationDeliveryLogEntity]), MessagingModule],
  providers: [InappWorkerService],
})
export class InappWorkerModule {}
