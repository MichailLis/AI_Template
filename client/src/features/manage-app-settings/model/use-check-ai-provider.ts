import { toast } from 'sonner';

import { useAdminSettingsControllerCheckAiProvider } from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

/** Платная проверка ключа провайдера ИИ: запускается только явным вызовом `check`. */
export function useCheckAiProvider() {
  const mutation = useAdminSettingsControllerCheckAiProvider({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Проверка не выполнена' }));
      },
    },
  });

  return {
    check: () => mutation.mutate(),
    isChecking: mutation.isPending,
    result: mutation.data,
  };
}
