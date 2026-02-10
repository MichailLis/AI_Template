import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import * as pg from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    const pool = new pg.Pool({
      connectionString: config.get<string>('DATABASE_URL'),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return;
    }

    await this.$connect();
  }

  async onModuleDestroy() {
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return;
    }

    await this.$disconnect();
  }
}
