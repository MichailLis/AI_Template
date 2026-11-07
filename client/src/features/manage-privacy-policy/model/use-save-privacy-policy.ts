import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey,
  useAdminSettingsControllerUpdatePrivacyPolicy,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import type { UpdatePrivacyPolicyDto } from '@/shared/api/model';

/** Публикация новой редакции политики персональных данных. */
export function useSavePrivacyPolicy({ onSaved }: { onSaved?: () => void } = {}) {
  const queryClient = useQueryClient();

  const mutation = useAdminSettingsControllerUpdatePrivacyPolicy({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        onSaved?.();
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey(),
        });
        toast.success('Политика персональных данных сохранена');
      },
    },
  });

  return {
    savePrivacyPolicy: (data: UpdatePrivacyPolicyDto) => mutation.mutate({ data }),
    isSaving: mutation.isPending,
  };
}
