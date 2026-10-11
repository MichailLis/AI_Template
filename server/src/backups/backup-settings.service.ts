import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuditService } from '../audit/audit.service';
import { collectAuditChanges } from '../audit/audit-changes';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { BackupStorage } from './backup-storage';
import { BackupSettingsSchema, type BackupSettings } from './backups.types';

const DEFAULT_SCHEDULE_HOUR_UTC = 3;
const DEFAULT_RETENTION_DAYS = 14;
const DEFAULT_MAX_COUNT = 30;
const HOUR_MS = 60 * 60 * 1000;

/** Ключ в журнале изменений: у настроек бэкапа одна запись на всю систему. */
export const BACKUP_SETTINGS_AUDIT_ID = 'backup-settings';

const readIntInRange = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

/**
 * Ближайший запуск по расписанию: сегодня в заданный час по UTC, а если он уже прошел — завтра.
 * Слот считается от `now`, поэтому перевод часов в контейнере на расписание не влияет.
 */
export const getNextScheduledRun = (settings: BackupSettings, now: Date): Date | null => {
  if (!settings.scheduleEnabled) {
    return null;
  }

  const slot = getCurrentScheduleSlot(settings, now);

  return new Date(slot.getTime() + 24 * HOUR_MS);
};

/** Последний наступивший слот расписания: сегодняшний, если его час уже пришел, иначе вчерашний. */
export const getCurrentScheduleSlot = (settings: BackupSettings, now: Date) => {
  const slot = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), settings.scheduleHourUtc),
  );

  return slot.getTime() > now.getTime() ? new Date(slot.getTime() - 24 * HOUR_MS) : slot;
};

/**
 * Настройки расписания и хранения копий. Пока админ их не сохранял, действуют переменные
 * окружения (`BACKUP_RETENTION_DAYS`, `BACKUP_MAX_COUNT`) и ежедневный запуск в 03:00 UTC.
 */
@Injectable()
export class BackupSettingsService {
  private readonly defaults: BackupSettings;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly storage: BackupStorage,
    config: ConfigService,
  ) {
    this.defaults = {
      scheduleEnabled: true,
      scheduleHourUtc: DEFAULT_SCHEDULE_HOUR_UTC,
      retentionDays: readIntInRange(
        config.get<string>('BACKUP_RETENTION_DAYS'),
        DEFAULT_RETENTION_DAYS,
        1,
        365,
      ),
      maxCount: readIntInRange(config.get<string>('BACKUP_MAX_COUNT'), DEFAULT_MAX_COUNT, 1, 200),
    };
  }

  async getSettings(): Promise<BackupSettings> {
    return (await this.storage.readSettings()) ?? this.defaults;
  }

  async updateSettings(userId: number, input: unknown) {
    await ensureAdminAccess(this.prisma, userId);

    const parsed = BackupSettingsSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException('Некорректные настройки резервного копирования');
    }

    const previous = await this.getSettings();
    const next = parsed.data;

    await this.storage.writeSettings(next);
    await this.audit.record({
      entityType: 'DATABASE_BACKUP',
      entityId: BACKUP_SETTINGS_AUDIT_ID,
      action: 'BACKUP_SETTINGS_UPDATED',
      actorUserId: userId,
      changes: collectAuditChanges(previous, next, {
        fields: ['scheduleEnabled', 'scheduleHourUtc', 'retentionDays', 'maxCount'],
      }),
    });

    return next;
  }
}
