import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetProfessionAtlasCoverageQueryKey,
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey,
  useAdminSettingsControllerUpdateProfessionAtlasUrl,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import type { UpdateProfessionAtlasUrlDto } from '@/shared/api/model';

/** Сохранение адресов Атласа профессий: после него обновляются и настройки, и покрытие. */
export function useSaveProfessionAtlasUrl({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useAdminSettingsControllerUpdateProfessionAtlasUrl({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        onSaved?.();
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey(),
          }),
          queryClient.invalidateQueries({
            queryKey: getAdminSettingsControllerGetProfessionAtlasCoverageQueryKey(),
          }),
        ]);
        toast.success('Настройки Атласа профессий сохранены');
      },
    },
  });

  return {
    saveProfessionAtlasUrl: (data: UpdateProfessionAtlasUrlDto) => mutation.mutate({ data }),
    isSaving: mutation.isPending,
  };
}
