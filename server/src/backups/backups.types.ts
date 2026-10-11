import { z } from 'zod';

export const BACKUP_STATUSES = ['RUNNING', 'READY', 'FAILED'] as const;

/** Кто запустил копию: админ кнопкой или расписание. Импорт и копия перед восстановлением добавят свои значения. */
export const BACKUP_TRIGGERS = ['MANUAL', 'SCHEDULED'] as const;

/** Описание копии, которое хранится рядом с файлом дампа (`<id>.json`). */
export const BackupMetadataSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  status: z.enum(BACKUP_STATUSES),
  trigger: z.enum(BACKUP_TRIGGERS),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  createdByUserId: z.number().int().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  sha256: z.string().nullable(),
  /** Версия сервера PostgreSQL и последняя миграция Prisma на момент копии: нужны будущему восстановлению. */
  serverVersion: z.string().nullable(),
  lastMigration: z.string().nullable(),
  errorMessage: z.string().nullable(),
});

export type BackupMetadata = z.infer<typeof BackupMetadataSchema>;

export type BackupTrigger = (typeof BACKUP_TRIGGERS)[number];

export const BACKUP_SETTINGS_LIMITS = {
  retentionDays: { min: 1, max: 365 },
  maxCount: { min: 1, max: 200 },
} as const;

/**
 * Настройки расписания и хранения. Лежат в томе (`settings.json`), а не в `app_settings`:
 * восстановление базы не должно откатывать их вместе с данными.
 */
export const BackupSettingsSchema = z.object({
  scheduleEnabled: z.boolean(),
  /** Час запуска по UTC: так время не зависит от часового пояса контейнера. */
  scheduleHourUtc: z.number().int().min(0).max(23),
  retentionDays: z
    .number()
    .int()
    .min(BACKUP_SETTINGS_LIMITS.retentionDays.min)
    .max(BACKUP_SETTINGS_LIMITS.retentionDays.max),
  maxCount: z
    .number()
    .int()
    .min(BACKUP_SETTINGS_LIMITS.maxCount.min)
    .max(BACKUP_SETTINGS_LIMITS.maxCount.max),
});

export type BackupSettings = z.infer<typeof BackupSettingsSchema>;
