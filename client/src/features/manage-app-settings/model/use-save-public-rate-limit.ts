import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetPublicRateLimitSettingsQueryKey,
  useAdminSettingsControllerUpdatePublicRateLimit,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import type { UpdatePublicRateLimitDto } from '@/shared/api/model';

/** Сохранение лимита запросов учеников. */
export function useSavePublicRateLimit({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useAdminSettingsControllerUpdatePublicRateLimit({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        onSaved?.();
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetPublicRateLimitSettingsQueryKey(),
        });
        toast.success('Лимит запросов сохранён');
      },
    },
  });

  return {
    savePublicRateLimit: (data: UpdatePublicRateLimitDto) => mutation.mutate({ data }),
    isSaving: mutation.isPending,
  };
}
