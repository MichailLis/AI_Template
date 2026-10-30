import { Injectable } from '@nestjs/common';

import { collectAuditChanges } from '../audit/audit-changes';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma.service';

/** Идентификатор настройки в журнале изменений. */
const PUBLIC_RATE_LIMIT_AUDIT_ENTITY_ID = 'public-rate-limit';
const PER_MINUTE_SETTING_KEY = 'publicRateLimit.perMinute';
const BURST_SETTING_KEY = 'publicRateLimit.burst';

/**
 * Решение владельца по #124: значения настраиваются в админке, по умолчанию щедрые — несколько
 * классов школы выходят в интернет с одного адреса и начинают тест одновременно.
 */
export const DEFAULT_PUBLIC_RATE_LIMIT = { perMinute: 60, burst: 120 };

export type PublicRateLimit = typeof DEFAULT_PUBLIC_RATE_LIMIT;

/** Без кеша: сервис объявлен в нескольких модулях (#167), и кеш одного не увидел бы правку в другом. */
@Injectable()
export class PublicRateLimitSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private async readStored() {
    const settings = await this.prisma.appSetting.findMany({
      where: { key: { in: [PER_MINUTE_SETTING_KEY, BURST_SETTING_KEY] } },
    });
    const readPositiveInt = (key: string, fallback: number) => {
      const value = Number(settings.find((setting) => setting.key === key)?.value);
      return Number.isInteger(value) && value >= 1 ? value : fallback;
    };
    const updatedAt =
      settings
        .map((setting) => setting.updatedAt)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

    return {
      limit: {
        perMinute: readPositiveInt(PER_MINUTE_SETTING_KEY, DEFAULT_PUBLIC_RATE_LIMIT.perMinute),
        burst: readPositiveInt(BURST_SETTING_KEY, DEFAULT_PUBLIC_RATE_LIMIT.burst),
      },
      updatedAt,
    };
  }

  async getLimit(): Promise<PublicRateLimit> {
    return (await this.readStored()).limit;
  }

  async getSettings() {
    const { limit, updatedAt } = await this.readStored();

    return {
      publicRateLimit: {
        ...limit,
        updatedAt: updatedAt ? updatedAt.toISOString() : null,
      },
    };
  }

  async updateSettings(userId: number, next: PublicRateLimit) {
    const previous = await this.getLimit();

    await this.prisma.$transaction(async (tx) => {
      for (const [key, value] of [
        [PER_MINUTE_SETTING_KEY, next.perMinute],
        [BURST_SETTING_KEY, next.burst],
      ] as const) {
        await tx.appSetting.upsert({
          where: { key },
          create: { key, value: String(value) },
          update: { value: String(value) },
        });
      }

      const changes = collectAuditChanges(previous, next, { fields: ['perMinute', 'burst'] });

      if (changes.length > 0) {
        await this.auditService.record(
          {
            entityType: 'APP_SETTING',
            entityId: PUBLIC_RATE_LIMIT_AUDIT_ENTITY_ID,
            action: 'SETTING_UPDATED',
            actorUserId: userId,
            changes,
          },
          tx,
        );
      }
    });

    return this.getSettings();
  }
}
