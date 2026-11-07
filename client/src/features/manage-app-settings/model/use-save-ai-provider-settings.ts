import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetAiProviderSettingsQueryKey,
  useAdminSettingsControllerUpdateAiProviderSettings,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import type { UpdateAiProviderDto } from '@/shared/api/model';

/** Сохранение настроек провайдера ИИ. */
export function useSaveAiProviderSettings({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useAdminSettingsControllerUpdateAiProviderSettings({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        onSaved?.();
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetAiProviderSettingsQueryKey(),
        });
        toast.success('Настройки провайдера ИИ сохранены');
      },
    },
  });

  return {
    saveAiProviderSettings: (data: UpdateAiProviderDto) => mutation.mutate({ data }),
    isSaving: mutation.isPending,
  };
}
