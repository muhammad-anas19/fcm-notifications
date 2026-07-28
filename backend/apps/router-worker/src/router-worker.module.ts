import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'app/common';
import { DatabaseModule, NotificationEntity } from 'app/database';
import { MessagingModule } from 'app/messaging';
import { RouterWorkerService } from './router-worker.service';

@Module({
  imports: [CommonModule, DatabaseModule, TypeOrmModule.forFeature([NotificationEntity]), MessagingModule],
  providers: [RouterWorkerService],
})
export class RouterWorkerModule {}
