import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerUpdateSettings,
} from '@/shared/api/generated/admin/admin';

import { toBackupErrorMessage } from '../lib/backup-error';

import type { AdminBackupsOverviewResponseDtoSettings } from '@/shared/api/model';

/** Сохранение расписания и срока хранения копий. */
export function useUpdateBackupSettings({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();

  const updateMutation = useAdminBackupsControllerUpdateSettings({
    mutation: {
      onError: (error) => {
        toast.error(toBackupErrorMessage(error));
      },
      onSuccess: async () => {
        onSaved?.();
        toast.success('Настройки резервного копирования сохранены');
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupsControllerGetOverviewQueryKey(),
        });
      },
    },
  });

  return {
    updateSettings: (settings: AdminBackupsOverviewResponseDtoSettings) =>
      updateMutation.mutate({ data: settings }),
    isSaving: updateMutation.isPending,
  };
}
