import type {
  AdminBackupsOverviewResponseDtoSettings,
  AdminBackupsOverviewResponseDto,
  AdminBackupsOverviewResponseDtoBackupsItem,
  AdminBackupsOverviewResponseDtoBackupsItemStatus,
} from '@/shared/api/model';

export type BackupsOverview = AdminBackupsOverviewResponseDto;
export type BackupItem = AdminBackupsOverviewResponseDtoBackupsItem;
export type BackupSettings = AdminBackupsOverviewResponseDtoSettings;

export const SCHEDULE_HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const pad = (value: number) => String(value).padStart(2, '0');

/**
 * Сервер хранит час запуска по UTC. Админу показывается его местное время и UTC в скобках,
 * чтобы час не путался при переезде сервера или смене часового пояса.
 */
export const formatScheduleHour = (hourUtc: number, now = new Date()) => {
  const local = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUtc),
  );

  return `${pad(local.getHours())}:${pad(local.getMinutes())} (${pad(hourUtc)}:00 UTC)`;
};

/** Пока копия создается, список опрашивается: статус меняется на сервере без участия клиента. */
export const BACKUPS_POLL_INTERVAL_MS = 2_000;

/** Совпадает с RESTORE_CONFIRMATION на сервере. */
export const RESTORE_CONFIRMATION = 'RESTORE';

export const backupStatusLabels: Record<AdminBackupsOverviewResponseDtoBackupsItemStatus, string> =
  {
    RUNNING: 'Создается',
    READY: 'Готова',
    FAILED: 'Ошибка',
  };

const SIZE_UNITS = ['Б', 'КБ', 'МБ', 'ГБ', 'ТБ'] as const;

export const formatBackupSize = (sizeBytes: number | null) => {
  if (sizeBytes === null) {
    return '—';
  }

  let value = sizeBytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < SIZE_UNITS.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const digits = unitIndex === 0 || value >= 10 ? 0 : 1;

  return `${value.toFixed(digits).replace('.', ',')} ${SIZE_UNITS[unitIndex]}`;
};

const backupTriggerLabels: Record<BackupItem['trigger'], string | null> = {
  MANUAL: null,
  SCHEDULED: 'По расписанию',
  PRE_RESTORE: 'Перед восстановлением',
  IMPORTED: 'Загружена',
};

/** Кто и почему создал копию: «Перед восстановлением · Иван», «По расписанию». */
export const getBackupAuthorLabel = (backup: BackupItem) => {
  const author = backup.createdBy ? (backup.createdBy.name ?? backup.createdBy.email) : null;

  return [backupTriggerLabels[backup.trigger], author].filter(Boolean).join(' · ') || 'Система';
};

export const shouldPollBackups = (overview: BackupsOverview | undefined) =>
  Boolean(overview?.isBusy || overview?.backups.some((backup) => backup.status === 'RUNNING'));
