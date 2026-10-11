import type {
  AdminBackupsOverviewResponseDto,
  AdminBackupsOverviewResponseDtoBackupsItem,
  AdminBackupsOverviewResponseDtoBackupsItemStatus,
} from '@/shared/api/model';

export type BackupsOverview = AdminBackupsOverviewResponseDto;
export type BackupItem = AdminBackupsOverviewResponseDtoBackupsItem;

/** Пока копия создается, список опрашивается: статус меняется на сервере без участия клиента. */
export const BACKUPS_POLL_INTERVAL_MS = 2_000;

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

export const getBackupAuthorLabel = (backup: BackupItem) =>
  backup.createdBy ? (backup.createdBy.name ?? backup.createdBy.email) : 'Система';

export const shouldPollBackups = (overview: BackupsOverview | undefined) =>
  Boolean(overview?.isBusy || overview?.backups.some((backup) => backup.status === 'RUNNING'));
