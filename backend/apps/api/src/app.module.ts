import { Module } from '@nestjs/common';
import { CommonModule } from 'app/common';
import { DatabaseModule } from 'app/database';
import { AdminModule } from './admin/admin.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DeviceTokensModule } from './device-tokens/device-tokens.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PreferencesModule } from './preferences/preferences.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    CommonModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    DeviceTokensModule,
    NotificationsModule,
    PreferencesModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
