import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerCreateBackup,
  useAdminBackupsControllerCreateDownloadLink,
  useAdminBackupsControllerDeleteBackup,
} from '@/shared/api/generated/admin/admin';

import { toBackupErrorMessage } from '../lib/backup-error';
import { startBrowserDownload } from '../lib/browser-download';

const showError = (error: unknown) => {
  toast.error(toBackupErrorMessage(error));
};

/** Сценарии над копиями: создать, скачать по одноразовой ссылке, удалить. */
export function useManageBackups({ onDeleted }: { onDeleted?: () => void } = {}) {
  const queryClient = useQueryClient();

  const refreshOverview = () =>
    queryClient.invalidateQueries({ queryKey: getAdminBackupsControllerGetOverviewQueryKey() });

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
        onDeleted?.();
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

  return {
    createBackup: () => createMutation.mutate(),
    isCreating: createMutation.isPending,
    downloadBackup: (id: string) => downloadMutation.mutate({ id }),
    isDownloading: downloadMutation.isPending,
    deleteBackup: (id: string) => deleteMutation.mutate({ id }),
    isDeleting: deleteMutation.isPending,
  };
}
