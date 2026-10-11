import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client, escapeIdentifier } from 'pg';

import { toPgConnectionEnv } from './database-connection.utils';

const MAINTENANCE_DATABASE = 'postgres';
const RENAME_ATTEMPTS = 5;
const RENAME_RETRY_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Операции над базами целиком (создать, удалить, переименовать), которые нельзя выполнить из
 * самой базы. Соединение идет к служебной базе `postgres` с теми же учетными данными; в
 * официальном образе PostgreSQL пользователь из POSTGRES_USER — суперпользователь.
 */
@Injectable()
export class DatabaseAdmin {
  constructor(private readonly config: ConfigService) {}

  /** Переменные libpq рабочей базы: имя базы, хост, пользователь и пароль. */
  get connectionEnv() {
    return toPgConnectionEnv(this.config.get<string>('DATABASE_URL') ?? '');
  }

  get databaseName() {
    return this.connectionEnv.PGDATABASE;
  }

  /** `DATABASE_URL` той же базы данных с другим именем: для `prisma migrate deploy` по временной базе. */
  databaseUrlFor(database: string) {
    const url = new URL(this.config.get<string>('DATABASE_URL') ?? '');
    url.pathname = `/${encodeURIComponent(database)}`;

    return url.toString();
  }

  async createDatabase(name: string) {
    await this.withClient(MAINTENANCE_DATABASE, (client) =>
      client.query(`CREATE DATABASE ${escapeIdentifier(name)}`),
    );
  }

  async dropDatabase(name: string) {
    await this.withClient(MAINTENANCE_DATABASE, async (client) => {
      await this.terminateConnections(client, name);
      await client.query(`DROP DATABASE IF EXISTS ${escapeIdentifier(name)}`);
    });
  }

  async listDatabases(prefix: string): Promise<string[]> {
    return this.withClient(MAINTENANCE_DATABASE, async (client) => {
      const result = await client.query<{ datname: string }>(
        'SELECT datname FROM pg_database WHERE starts_with(datname, $1) ORDER BY datname',
        [prefix],
      );

      return result.rows.map((row) => row.datname);
    });
  }

  /**
   * Меняет местами рабочую базу и подготовленную: рабочая уходит под `previousName`, подготовленная
   * получает имя рабочей. Переименование требует, чтобы к базе никто не был подключен, а пул
   * приложения может успеть открыть новое соединение, поэтому разрыв и переименование повторяются.
   */
  async swapDatabases(current: string, replacement: string, previousName: string) {
    await this.withClient(MAINTENANCE_DATABASE, async (client) => {
      await this.renameWithRetry(client, current, previousName);

      try {
        await this.renameWithRetry(client, replacement, current);
      } catch (error) {
        await this.renameWithRetry(client, previousName, current);
        throw error;
      }
    });
  }

  async query<T extends Record<string, unknown>>(
    database: string,
    sql: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return this.withClient(database, async (client) => (await client.query<T>(sql, params)).rows);
  }

  private async renameWithRetry(client: Client, from: string, to: string) {
    for (let attempt = 1; ; attempt += 1) {
      await this.terminateConnections(client, from);

      try {
        await client.query(
          `ALTER DATABASE ${escapeIdentifier(from)} RENAME TO ${escapeIdentifier(to)}`,
        );
        return;
      } catch (error) {
        if (attempt >= RENAME_ATTEMPTS) {
          throw error;
        }

        await sleep(RENAME_RETRY_DELAY_MS);
      }
    }
  }

  private async terminateConnections(client: Client, database: string) {
    await client.query(
      'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()',
      [database],
    );
  }

  private async withClient<T>(database: string, run: (client: Client) => Promise<T>): Promise<T> {
    const env = this.connectionEnv;
    const client = new Client({
      host: env.PGHOST,
      port: Number(env.PGPORT),
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database,
      ssl: env.PGSSLMODE && env.PGSSLMODE !== 'disable' ? { rejectUnauthorized: false } : undefined,
    });

    await client.connect();

    try {
      return await run(client);
    } finally {
      await client.end();
    }
  }
}
