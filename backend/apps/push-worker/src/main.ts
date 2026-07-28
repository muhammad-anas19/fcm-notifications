import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { PushWorkerModule } from './push-worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(PushWorkerModule);
  Logger.log('push-worker is consuming push.queue', 'Bootstrap');
}
bootstrap();
