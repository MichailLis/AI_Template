import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsAdminAttemptsControllerGetAttemptDetailQueryKey,
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey,
  useTestsAdminAttemptsControllerRestartAttemptAnalysis,
  useTestsAdminAttemptsControllerRestartFailedAnalyses,
} from '@/shared/api/generated/tests/tests';
import { getApiErrorMessage } from '@/shared/lib/api-error';

const showError = (error: unknown) => {
  toast.error(getApiErrorMessage(error, { fallbackMessage: 'Не удалось перезапустить анализ' }));
};

/**
 * Перезапуск упавшего ИИ-анализа: одной попытки и всех неудачных попыток ссылки. Сервер сам решает,
 * что перезапускать: нажатие по анализу, который уже идёт или готов, ничего не делает и честно
 * отвечает об этом, поэтому и двойной клик, и две вкладки безопасны.
 */
export const useRestartAnalysis = (publicLinkId: number | null) => {
  const queryClient = useQueryClient();

  // Таблица (статус «ИИ в обработке», счётчик неудачных) и карточка попытки меняются вместе.
  const refresh = async (attemptId?: number) => {
    const refreshes = [
      queryClient.invalidateQueries({
        queryKey: getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey(publicLinkId ?? 0),
      }),
    ];

    if (attemptId !== undefined) {
      refreshes.push(
        queryClient.invalidateQueries({
          queryKey: getTestsAdminAttemptsControllerGetAttemptDetailQueryKey(attemptId),
        }),
      );
    }

    await Promise.all(refreshes);
  };

  const attemptMutation = useTestsAdminAttemptsControllerRestartAttemptAnalysis({
    mutation: {
      onError: showError,
      onSuccess: async ({ attemptId, restarted }) => {
        await refresh(attemptId);

        if (restarted) {
          toast.success('Анализ перезапущен: результат появится через несколько минут');
        } else {
          toast.info('Перезапуск не нужен: анализ уже идёт или готов');
        }
      },
    },
  });
  const failedMutation = useTestsAdminAttemptsControllerRestartFailedAnalyses({
    mutation: {
      onError: showError,
      onSuccess: async ({ restarted }) => {
        await refresh();

        if (restarted > 0) {
          toast.success(`Перезапущено анализов: ${restarted}`);
        } else {
          toast.info('Неудачных анализов не осталось');
        }
      },
    },
  });

  return {
    restartAttemptAnalysis: (attemptId: number) => attemptMutation.mutate({ attemptId }),
    isRestartingAttempt: attemptMutation.isPending,
    restartFailedAnalyses: () => {
      if (publicLinkId) {
        failedMutation.mutate({ linkId: publicLinkId });
      }
    },
    isRestartingFailed: failedMutation.isPending,
  };
};
