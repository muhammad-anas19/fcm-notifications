import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumberString, IsOptional, IsString, validateSync } from 'class-validator';

/**
 * Fail fast on a missing/malformed env var at boot, instead of hitting a confusing runtime
 * error the first time that var is actually used (e.g. a `DATABASE_URL` typo surfacing as a
 * cryptic pg connection error deep inside a request handler).
 */
class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @IsNotEmpty()
  RABBITMQ_URL: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsString()
  JWT_EXPIRES_IN?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsOptional()
  @IsString()
  FIREBASE_CREDENTIALS_PATH?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, { enableImplicitConversion: true });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n${errors.toString()}`);
  }
  return validated;
}
