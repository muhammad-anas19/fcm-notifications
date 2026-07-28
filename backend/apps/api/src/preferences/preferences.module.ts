import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreferenceEntity } from 'app/database';
import { PreferencesController } from './preferences.controller';
import { PreferencesService } from './preferences.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationPreferenceEntity])],
  controllers: [PreferencesController],
  providers: [PreferencesService],
})
export class PreferencesModule {}
