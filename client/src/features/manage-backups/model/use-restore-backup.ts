import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminBackupOperationControllerGetOperationQueryKey,
  useAdminBackupsControllerRestoreBackup,
  useAdminBackupsControllerUndoRestore,
} from '@/shared/api/generated/admin/admin';

import { toBackupErrorMessage } from '../lib/backup-error';

const showError = (error: unknown) => {
  toast.error(toBackupErrorMessage(error));
};

/** Запуск восстановления базы из копии. Слово подтверждения проверяет вызывающий и сервер. */
export function useRestoreBackup({ onStarted }: { onStarted?: () => void } = {}) {
  const queryClient = useQueryClient();

  const restoreMutation = useAdminBackupsControllerRestoreBackup({
    mutation: {
      onError: showError,
      onSuccess: async () => {
        onStarted?.();
        toast.success('Восстановление запущено');
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupOperationControllerGetOperationQueryKey(),
        });
      },
    },
  });

  return {
    restoreBackup: (id: string, confirmation: string) =>
      restoreMutation.mutate({ id, data: { confirmation } }),
    isRestoring: restoreMutation.isPending,
  };
}

/** Возврат базы, которая была до последнего восстановления. */
export function useUndoRestore({ onUndone }: { onUndone?: () => void } = {}) {
  const queryClient = useQueryClient();

  const undoMutation = useAdminBackupsControllerUndoRestore({
    mutation: {
      onError: showError,
      onSuccess: async () => {
        onUndone?.();
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupOperationControllerGetOperationQueryKey(),
        });
      },
    },
  });

  return {
    undoRestore: () => undoMutation.mutate(),
    isUndoing: undoMutation.isPending,
  };
}
