import { Module } from '@nestjs/common';
import { DeviceTokensController } from './device-tokens.controller';

@Module({
  controllers: [DeviceTokensController],
})
export class DeviceTokensModule {}
