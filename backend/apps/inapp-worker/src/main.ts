import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { InappWorkerModule } from './inapp-worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(InappWorkerModule);
  Logger.log('inapp-worker is consuming inapp.queue', 'Bootstrap');
}
bootstrap();
