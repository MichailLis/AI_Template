import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: pg.Pool;
  /** Флаг для генерации OpenAPI и тестов без базы: соединение не открывается. */
  private readonly skipDbConnect: boolean;

  constructor(config: ConfigService) {
    const pool = new pg.Pool({
      connectionString: config.get<string>('DATABASE_URL'),
    });
    // Сервер может оборвать простаивающее соединение (перезапуск PostgreSQL, восстановление базы
    // из копии). Без обработчика pg.Pool бросает необработанный 'error' и роняет процесс; с ним
    // соединение просто выбрасывается из пула, следующий запрос откроет новое.
    pool.on('error', (error) => {
      Logger.warn(`Idle database connection closed: ${error.message}`, PrismaService.name);
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
    this.skipDbConnect = config.get<string>('SKIP_DB_CONNECT') === 'true';
  }

  async onModuleInit() {
    if (this.skipDbConnect) {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (!this.skipDbConnect) {
      await this.$disconnect();
    }

    await this.pool.end();
  }
}
