import 'dotenv/config';
import { DataSource } from 'typeorm';
import { ALL_ENTITIES } from './entities.list';

/**
 * Used by the TypeORM CLI (`npm run migration:generate` / `migration:run`) and by the
 * `migrate` container in docker-compose — a standalone DataSource, deliberately outside the
 * Nest DI container, since the CLI runs before any Nest app exists. `DatabaseModule` below
 * builds its TypeOrmModule options from the same env vars so app and CLI never drift.
 */
export const dataSourceOptions = {
  type: 'postgres' as const,
  url: process.env.DATABASE_URL,
  entities: ALL_ENTITIES,
  migrations: [__dirname + '/../migrations/*.{ts,js}'],
  synchronize: false,
};

export default new DataSource(dataSourceOptions);
