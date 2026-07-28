import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [NotificationsModule, UsersModule],
  controllers: [AdminController],
})
export class AdminModule {}
