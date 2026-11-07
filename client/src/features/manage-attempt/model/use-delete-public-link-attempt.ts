import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsAdminAnalyticsControllerGetSummaryQueryKey,
  getTestsAdminAttemptsControllerGetAttemptDetailQueryKey,
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey,
  getTestsAdminPublicLinksControllerGetPublicLinkHistoryQueryKey,
  useTestsAdminAttemptsControllerDeletePublicLinkAttempt,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

/**
 * Удаление попытки необратимо. После успеха обновляем всё, что её показывает: список прохождений,
 * аналитику темы и журнал ссылки, где появилась запись об удалении.
 */
export const useDeletePublicLinkAttempt = (linkId: number | null, topicId: number | null) => {
  const queryClient = useQueryClient();
  const deleteAttemptMutation = useTestsAdminAttemptsControllerDeletePublicLinkAttempt();

  const deleteAttempt = (attemptId: number, onDeleted: () => void) => {
    if (linkId === null) {
      return;
    }

    deleteAttemptMutation.mutate(
      { linkId, attemptId },
      {
        onSuccess: () => {
          toast.success('Попытка удалена');
          onDeleted();
          queryClient.removeQueries({
            queryKey: getTestsAdminAttemptsControllerGetAttemptDetailQueryKey(attemptId),
          });
          void queryClient.invalidateQueries({
            queryKey: getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey(linkId),
          });
          void queryClient.invalidateQueries({
            queryKey: getTestsAdminPublicLinksControllerGetPublicLinkHistoryQueryKey(linkId),
          });
          if (topicId !== null) {
            void queryClient.invalidateQueries({
              queryKey: getTestsAdminAnalyticsControllerGetSummaryQueryKey(topicId),
            });
          }
        },
        onError: (error) => toast.error(parseApiError(error)),
      },
    );
  };

  return { deleteAttempt, isDeleting: deleteAttemptMutation.isPending };
};
