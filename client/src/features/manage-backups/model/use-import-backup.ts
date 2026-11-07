import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerImportBackup,
} from '@/shared/api/generated/admin/admin';

import { toBackupErrorMessage } from '../lib/backup-error';

/**
 * Загрузка готового дампа (.dump) с этого или другого сервера. Файл уходит телом запроса как есть,
 * поэтому браузер показывает настоящий прогресс отправки.
 */
export function useImportBackup() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number | null>(null);

  const importMutation = useAdminBackupsControllerImportBackup({
    request: {
      onUploadProgress: (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
    mutation: {
      onError: (error) => {
        toast.error(toBackupErrorMessage(error));
      },
      onSuccess: async () => {
        toast.success('Копия загружена. Восстановить базу из нее можно кнопкой «Восстановить»');
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupsControllerGetOverviewQueryKey(),
        });
      },
      onSettled: () => {
        setProgress(null);
      },
    },
  });

  return {
    importBackup: (file: File) => {
      setProgress(0);
      importMutation.mutate({ data: file, params: { fileName: file.name } });
    },
    isImporting: importMutation.isPending,
    progress,
  };
}
