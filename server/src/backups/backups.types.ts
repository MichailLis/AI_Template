import { z } from 'zod';

export const BACKUP_STATUSES = ['RUNNING', 'READY', 'FAILED'] as const;

/** Пока копии создаются только вручную; расписание, импорт и копия перед восстановлением добавят свои значения. */
export const BACKUP_TRIGGERS = ['MANUAL'] as const;

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
