import { HardDrive, TriangleAlert } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';

import { BackupScheduleForm } from './admin-settings-backup-schedule';
import { formatBackupSize } from './admin-settings-backups.model';

import type { BackupsOverview } from './admin-settings-backups.model';

/**
 * Место на диске под копии. Предупреждение появляется заранее, пока еще есть место на пару
 * копий: когда его не останется, плановая копия будет пропущена и попадет в список с ошибкой.
 */
export function BackupStorageInfo({ storage }: { storage: BackupsOverview['storage'] }) {
  const parts = [
    storage.freeBytes !== null ? `свободно ${formatBackupSize(storage.freeBytes)}` : null,
    `копии занимают ${formatBackupSize(storage.usedBytes)}`,
    storage.databaseBytes !== null ? `база ${formatBackupSize(storage.databaseBytes)}` : null,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-2">
      <p className={`flex items-center gap-2 text-xs ${adminClassNames.text.muted}`}>
        <HardDrive className="size-3.5 shrink-0" />
        На диске: {parts.join(' · ')}
      </p>
      {storage.lowSpace ? (
        <div className={`flex items-start gap-2 ${adminClassNames.panel.warningInline}`}>
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>
            Место на диске заканчивается. Скачайте нужные копии и удалите старые, уменьшите срок
            хранения или освободите место на сервере. Без места новые копии создаваться не будут.
          </span>
        </div>
      ) : null}
    </div>
  );
}

/** Состояние инструментов, место на диске и расписание: все, что зависит от ответа сервера. */
export function BackupOverviewSections({ overview }: { overview: BackupsOverview }) {
  const { availability } = overview;

  return (
    <>
      {availability.available ? null : (
        <div className={`flex items-start gap-2 ${adminClassNames.panel.warningInline}`}>
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          <span>Резервное копирование недоступно: {availability.reason}</span>
        </div>
      )}

      <BackupStorageInfo storage={overview.storage} />

      {availability.pgDumpVersion ? (
        <p className={`text-xs ${adminClassNames.text.muted}`}>
          {availability.pgDumpVersion}
          {availability.serverVersion ? ` · сервер PostgreSQL ${availability.serverVersion}` : ''}
        </p>
      ) : null}

      <BackupScheduleForm settings={overview.settings} nextScheduledAt={overview.nextScheduledAt} />
    </>
  );
}
