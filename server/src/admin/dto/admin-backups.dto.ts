import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  BACKUP_STATUSES,
  BACKUP_TRIGGERS,
  BackupSettingsSchema,
} from '../../backups/backups.types';

/** Путь к файлу на сервере наружу не отдается: клиенту хватает идентификатора и имени. */
export const AdminBackupSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  status: z.enum(BACKUP_STATUSES),
  trigger: z.enum(BACKUP_TRIGGERS),
  createdAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  sizeBytes: z.number().int().nonnegative().nullable(),
  sha256: z.string().nullable(),
  errorMessage: z.string().nullable(),
  createdBy: z
    .object({
      id: z.number().int(),
      email: z.string(),
      name: z.string().nullable(),
    })
    .nullable(),
});

export const AdminBackupAvailabilitySchema = z.object({
  available: z.boolean(),
  /** Почему копию сейчас сделать нельзя: нет pg_dump, версии не совпадают, каталог недоступен. */
  reason: z.string().nullable(),
  pgDumpVersion: z.string().nullable(),
  serverVersion: z.string().nullable(),
});

export const AdminBackupsOverviewResponseSchema = z.object({
  availability: AdminBackupAvailabilitySchema,
  settings: BackupSettingsSchema,
  /** Ближайший запуск по расписанию; null — расписание выключено. */
  nextScheduledAt: z.string().datetime().nullable(),
  /** Идет ли сейчас создание копии: клиент опрашивает список, пока операция не закончится. */
  isBusy: z.boolean(),
  backups: z.array(AdminBackupSchema),
});

export const AdminBackupResponseSchema = z.object({
  backup: AdminBackupSchema,
});

export const AdminBackupDeleteResponseSchema = z.object({
  id: z.string(),
});

export const AdminBackupDownloadLinkResponseSchema = z.object({
  /** Путь относительно адреса API; ссылка одноразовая и живет минуту. */
  path: z.string(),
  expiresAt: z.string().datetime(),
});

export const AdminBackupSettingsResponseSchema = z.object({
  settings: BackupSettingsSchema,
});

export class UpdateBackupSettingsDto extends createZodDto(BackupSettingsSchema) {}

export class AdminBackupSettingsResponseDto extends createZodDto(
  AdminBackupSettingsResponseSchema,
) {}

export class AdminBackupsOverviewResponseDto extends createZodDto(
  AdminBackupsOverviewResponseSchema,
) {}

export class AdminBackupResponseDto extends createZodDto(AdminBackupResponseSchema) {}

export class AdminBackupDeleteResponseDto extends createZodDto(AdminBackupDeleteResponseSchema) {}

export class AdminBackupDownloadLinkResponseDto extends createZodDto(
  AdminBackupDownloadLinkResponseSchema,
) {}

export const RestoreOperationSchema = z.object({
  kind: z.enum(['RESTORE', 'UNDO']),
  status: z.enum(['RUNNING', 'SUCCEEDED', 'FAILED']),
  backupId: z.string().nullable(),
  fileName: z.string().nullable(),
  /** Текущий шаг человеческим языком: «Развертывание копии во временной базе». */
  step: z.string(),
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().nullable(),
  errorMessage: z.string().nullable(),
});

export const AdminBackupOperationResponseSchema = z.object({
  /** Идет подмена базы: остальные маршруты API отвечают 503. */
  maintenance: z.boolean(),
  /** Последняя операция восстановления с момента запуска backend; null — их не было. */
  operation: RestoreOperationSchema.nullable(),
  /** База, сохраненная до последнего восстановления: пока она есть, восстановление можно отменить. */
  previousDatabase: z
    .object({
      name: z.string(),
      restoredAt: z.string().datetime(),
      backupId: z.string(),
    })
    .nullable(),
});

export const RestoreBackupSchema = z.object({
  /** Слово RESTORE: защита от случайного нажатия. */
  confirmation: z.string(),
});

export const AdminRestoreStartResponseSchema = z.object({
  operation: RestoreOperationSchema,
});

export class AdminBackupOperationResponseDto extends createZodDto(
  AdminBackupOperationResponseSchema,
) {}

export class RestoreBackupDto extends createZodDto(RestoreBackupSchema) {}

export class AdminRestoreStartResponseDto extends createZodDto(AdminRestoreStartResponseSchema) {}
