import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceTokensQueryService } from './device-tokens-query.service';
import { DeviceTokenEntity, NotificationPreferenceEntity } from './entities';
import { ALL_ENTITIES } from './entities.list';
import { PreferencesQueryService } from './preferences-query.service';

/** @Global so every app (api + every worker) gets TypeOrmModule's repositories and the shared
 * query services below just by importing DatabaseModule once at the root — no need for every
 * feature module across every app to re-declare TypeOrmModule.forFeature for these. */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: ALL_ENTITIES,
        // Never true outside a throwaway sandbox: schema changes belong in migrations
        // (docs/14-deployment.md) — synchronize would let the app silently reshape
        // production tables on boot.
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([NotificationPreferenceEntity, DeviceTokenEntity]),
  ],
  providers: [PreferencesQueryService, DeviceTokensQueryService],
  exports: [TypeOrmModule, PreferencesQueryService, DeviceTokensQueryService],
})
export class DatabaseModule {}
