import { DatabaseBackup, Download, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { formatDateTime } from '@/shared/lib/date-format';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

import { BackupImportButton } from './admin-settings-backup-import';
import { RestoreBackupDialog, RestoreStatusPanel } from './admin-settings-backup-restore';
import { BackupOverviewSections } from './admin-settings-backup-storage';
import {
  backupStatusLabels,
  formatBackupSize,
  getBackupAuthorLabel,
} from './admin-settings-backups.model';
import { SettingsLoadError } from './admin-settings-cards.parts';
import { toBackupErrorMessage, useBackupsSettings } from './use-backups-settings';
import { useRestoreOperation } from './use-restore-operation';

import type { BackupItem } from './admin-settings-backups.model';

const statusBadgeClassNames: Record<BackupItem['status'], string> = {
  RUNNING: adminBadgeClassNames.info,
  READY: adminBadgeClassNames.success,
  FAILED: adminBadgeClassNames.danger,
};

interface BackupRowProps {
  backup: BackupItem;
  isDownloading: boolean;
  isRestoreBlocked: boolean;
  onRestore: (backup: BackupItem) => void;
  onDownload: (backup: BackupItem) => void;
  onDelete: (backup: BackupItem) => void;
}

function BackupRow({
  backup,
  isDownloading,
  isRestoreBlocked,
  onDownload,
  onRestore,
  onDelete,
}: BackupRowProps) {
  return (
    <li
      className={`flex flex-wrap items-start justify-between gap-3 ${adminClassNames.panel.listRow}`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`font-medium ${adminClassNames.text.heading}`}>
            {formatDateTime(backup.createdAt)}
          </span>
          <Badge variant="outline" className={statusBadgeClassNames[backup.status]}>
            {backupStatusLabels[backup.status]}
          </Badge>
        </div>
        <p className={`text-xs ${adminClassNames.text.muted}`}>
          {formatBackupSize(backup.sizeBytes)} · {getBackupAuthorLabel(backup)}
        </p>
        <p className={`break-all font-mono text-xs ${adminClassNames.text.muted}`}>
          {backup.fileName}
        </p>
        {backup.originalFileName ? (
          <p className={`break-all text-xs ${adminClassNames.text.muted}`}>
            Загружена из файла {backup.originalFileName}
          </p>
        ) : null}
        {backup.errorMessage ? (
          <p className="break-words text-xs text-admin-danger-foreground">{backup.errorMessage}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={backup.status !== 'READY' || isDownloading}
          onClick={() => onDownload(backup)}
        >
          <Download />
          Скачать
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={backup.status !== 'READY' || isRestoreBlocked}
          onClick={() => onRestore(backup)}
        >
          <RotateCcw />
          Восстановить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          aria-label={`Удалить копию ${backup.fileName}`}
          disabled={backup.status === 'RUNNING'}
          onClick={() => onDelete(backup)}
        >
          <Trash2 />
        </Button>
      </div>
    </li>
  );
}

export function BackupsSettingsCard() {
  const {
    overviewQuery,
    overview,
    isRunning,
    canCreate,
    createBackup,
    isDownloading,
    downloadBackup,
    backupToDelete,
    setBackupToDelete,
    isDeleting,
    confirmDelete,
  } = useBackupsSettings();
  const restore = useRestoreOperation();
  const [backupToRestore, setBackupToRestore] = useState<BackupItem | null>(null);

  return (
    <Card className={`rounded-lg ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DatabaseBackup className="size-4 shrink-0 text-admin-muted" />
              Резервные копии базы данных
            </CardTitle>
            <CardDescription>
              Полная копия базы в формате pg_dump. Копии хранятся на сервере
              {overview
                ? ` ${overview.settings.retentionDays} дн., не больше ${overview.settings.maxCount} шт.`
                : '.'}{' '}
              Скачайте копию, чтобы у вас был экземпляр вне сервера.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <BackupImportButton disabled={restore.isRunning} />
            <Button
              type="button"
              size="sm"
              disabled={!canCreate || restore.isRunning}
              onClick={createBackup}
            >
              <Plus />
              {isRunning ? 'Копия создается...' : 'Создать копию'}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-4">
        {overviewQuery.isLoading ? (
          <div className={adminClassNames.panel.loading}>Загружаем список копий...</div>
        ) : null}

        {overviewQuery.isError ? (
          <SettingsLoadError
            message={toBackupErrorMessage(overviewQuery.error)}
            onRetry={() => {
              void overviewQuery.refetch();
            }}
          />
        ) : null}

        <RestoreStatusPanel status={restore.status} onRefresh={restore.refreshOperation} />

        {overview ? <BackupOverviewSections overview={overview} /> : null}

        {overview && overview.backups.length === 0 ? (
          <div className={adminClassNames.panel.emptyCenter}>Копий пока нет</div>
        ) : null}

        {overview && overview.backups.length > 0 ? (
          <ul className={adminClassNames.panel.frame}>
            {overview.backups.map((backup) => (
              <BackupRow
                key={backup.id}
                backup={backup}
                isDownloading={isDownloading}
                isRestoreBlocked={isRunning || restore.isRunning}
                onRestore={setBackupToRestore}
                onDownload={downloadBackup}
                onDelete={setBackupToDelete}
              />
            ))}
          </ul>
        ) : null}
      </CardContent>

      <RestoreBackupDialog
        backup={backupToRestore}
        onClose={() => setBackupToRestore(null)}
        onStarted={restore.refreshOperation}
      />

      <ConfirmActionDialog
        open={backupToDelete !== null}
        title="Удалить резервную копию?"
        description={
          backupToDelete
            ? `Файл ${backupToDelete.fileName} будет удален с сервера без возможности восстановления.`
            : ''
        }
        confirmLabel="Удалить"
        variant="destructive"
        isConfirming={isDeleting}
        onConfirm={confirmDelete}
        onClose={() => setBackupToDelete(null)}
      />
    </Card>
  );
}
