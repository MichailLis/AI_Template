import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { buildApiUrl } from '@/shared/api/api';
import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerCreateBackup,
  useAdminBackupsControllerCreateDownloadLink,
  useAdminBackupsControllerDeleteBackup,
  useAdminBackupsControllerGetOverview,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import { BACKUPS_POLL_INTERVAL_MS, shouldPollBackups } from './admin-settings-backups.model';

import type { BackupItem } from './admin-settings-backups.model';

export const toBackupErrorMessage = (error: unknown) =>
  getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' });

/** Файл отдает сервер по одноразовой ссылке: браузер качает его сам, не держа весь дамп в памяти. */
const startBrowserDownload = (path: string) => {
  const link = document.createElement('a');

  link.href = buildApiUrl(path);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export function useBackupsSettings() {
  const queryClient = useQueryClient();
  const [backupToDelete, setBackupToDelete] = useState<BackupItem | null>(null);
  const overviewQuery = useAdminBackupsControllerGetOverview({
    query: {
      refetchInterval: (query) =>
        shouldPollBackups(query.state.data) ? BACKUPS_POLL_INTERVAL_MS : false,
    },
  });
  const overview = overviewQuery.data;

  const refreshOverview = () =>
    queryClient.invalidateQueries({ queryKey: getAdminBackupsControllerGetOverviewQueryKey() });

  const showError = (error: unknown) => {
    toast.error(toBackupErrorMessage(error));
  };

  const createMutation = useAdminBackupsControllerCreateBackup({
    mutation: {
      onError: showError,
      onSuccess: async () => {
        toast.success('Создание копии запущено');
        await refreshOverview();
      },
    },
  });

  const deleteMutation = useAdminBackupsControllerDeleteBackup({
    mutation: {
      onError: showError,
      onSuccess: async () => {
        setBackupToDelete(null);
        toast.success('Копия удалена');
        await refreshOverview();
      },
    },
  });

  const downloadMutation = useAdminBackupsControllerCreateDownloadLink({
    mutation: {
      onError: showError,
      onSuccess: (link) => {
        startBrowserDownload(link.path);
      },
    },
  });

  const isRunning = shouldPollBackups(overview);

  return {
    overviewQuery,
    overview,
    isRunning,
    canCreate: Boolean(overview?.availability.available) && !isRunning && !createMutation.isPending,
    createBackup: () => createMutation.mutate(),
    isDownloading: downloadMutation.isPending,
    downloadBackup: (backup: BackupItem) => downloadMutation.mutate({ id: backup.id }),
    backupToDelete,
    setBackupToDelete,
    isDeleting: deleteMutation.isPending,
    confirmDelete: () => {
      if (backupToDelete) {
        deleteMutation.mutate({ id: backupToDelete.id });
      }
    },
  };
}
