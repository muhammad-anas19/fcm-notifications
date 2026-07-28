import { Module } from '@nestjs/common';
import { PUSH_PROVIDER } from 'app/domain';
import { FcmProvider } from './fcm.provider';

@Module({
  providers: [{ provide: PUSH_PROVIDER, useClass: FcmProvider }],
  exports: [PUSH_PROVIDER],
})
export class ProvidersModule {}
