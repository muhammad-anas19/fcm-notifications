import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './env-validation';
import { HttpExceptionFilter } from './http-exception.filter';

/** Imported once by each app's root module — gives every app validated config (fail fast on a
 * missing/malformed env var) and one consistent error response shape, without each app having
 * to wire it up itself. */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
  ],
  providers: [{ provide: APP_FILTER, useClass: HttpExceptionFilter }],
  exports: [ConfigModule],
})
export class CommonModule {}
