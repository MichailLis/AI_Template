import { useState } from 'react';

import { useManageBackups } from '@/features/manage-backups';
import { useAdminBackupsControllerGetOverview } from '@/shared/api/generated/admin/admin';

import { BACKUPS_POLL_INTERVAL_MS, shouldPollBackups } from '../lib/admin-settings-backups';

import type { BackupItem } from '../lib/admin-settings-backups';

export function useBackupsSettings() {
  const [backupToDelete, setBackupToDelete] = useState<BackupItem | null>(null);
  const overviewQuery = useAdminBackupsControllerGetOverview({
    query: {
      refetchInterval: (query) =>
        shouldPollBackups(query.state.data) ? BACKUPS_POLL_INTERVAL_MS : false,
    },
  });
  const overview = overviewQuery.data;
  const { createBackup, isCreating, downloadBackup, isDownloading, deleteBackup, isDeleting } =
    useManageBackups({ onDeleted: () => setBackupToDelete(null) });

  const isRunning = shouldPollBackups(overview);

  return {
    overviewQuery,
    overview,
    isRunning,
    canCreate: Boolean(overview?.availability.available) && !isRunning && !isCreating,
    createBackup,
    isDownloading,
    downloadBackup: (backup: BackupItem) => downloadBackup(backup.id),
    backupToDelete,
    setBackupToDelete,
    isDeleting,
    confirmDelete: () => {
      if (backupToDelete) {
        deleteBackup(backupToDelete.id);
      }
    },
  };
}
