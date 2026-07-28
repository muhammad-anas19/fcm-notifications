import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RouterWorkerModule } from './router-worker.module';

/** No HTTP server — this process only consumes from RabbitMQ (docs/06-background-jobs-and-workers.md).
 * `createApplicationContext` boots Nest's DI container without an HTTP listener; the process
 * stays alive because the AMQP connection keeps the event loop busy. */
async function bootstrap() {
  await NestFactory.createApplicationContext(RouterWorkerModule);
  Logger.log('router-worker is consuming router.queue', 'Bootstrap');
}
bootstrap();
