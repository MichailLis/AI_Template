import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  getTestsAdminAnalyticsControllerGetSummaryQueryKey,
  getTestsAdminAttemptsControllerGetAttemptDetailQueryKey,
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey,
  getTestsAdminPublicLinksControllerGetPublicLinkHistoryQueryKey,
  useTestsAdminAttemptsControllerDeletePublicLinkAttempt,
  useTestsAdminAttemptsControllerGetAttemptDetail,
  useTestsAdminAttemptsControllerListPublicLinkAttempts,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import { ATTEMPTS_LIMIT } from './use-admin-public-links-stats-workspace.model';

import type { AttemptDetailView } from './use-admin-public-links-stats-workspace.model';
import type { TestsAdminAttemptsControllerListPublicLinkAttemptsParams } from '@/shared/api/model';

/** Пока ИИ-анализ идёт (в том числе после перезапуска), таблица и карточка сами догружают итог. */
const PENDING_ANALYSIS_POLL_MS = 5000;
const PENDING_RESULT_KINDS: ReadonlySet<string> = new Set(['PENDING', 'ALGORITHM_AI_PENDING']);

export type AttemptsListFilters = Pick<
  TestsAdminAttemptsControllerListPublicLinkAttemptsParams,
  'search' | 'status' | 'sortBy' | 'sortOrder'
>;

export const usePaginatedPublicAttempts = (
  effectivePublicLinkId: number | null,
  attemptsPage: number,
  attemptsLimit: number = ATTEMPTS_LIMIT,
  filters: AttemptsListFilters = {},
) => {
  const publicAttemptsQuery = useTestsAdminAttemptsControllerListPublicLinkAttempts(
    effectivePublicLinkId ?? 0,
    { page: attemptsPage, limit: attemptsLimit, ...filters },
    {
      query: {
        enabled: Boolean(effectivePublicLinkId),
        refetchInterval: (query) =>
          query.state.data?.attempts.some((attempt) =>
            PENDING_RESULT_KINDS.has(attempt.analysisResultKind),
          )
            ? PENDING_ANALYSIS_POLL_MS
            : false,
      },
    },
  );
  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  return {
    failedAnalysisCount: publicAttemptsQuery.data?.failedAnalysisCount ?? 0,
    publicAttempts,
    publicAttemptsPage: publicAttemptsQuery.data?.page ?? attemptsPage,
    publicAttemptsQuery,
    publicAttemptsTotal: publicAttemptsQuery.data?.total ?? 0,
    publicAttemptsTotalPages: publicAttemptsQuery.data?.totalPages ?? 1,
  };
};

export const useAttemptDetail = () => {
  const [detailAttemptId, setDetailAttemptId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<AttemptDetailView | null>(null);
  const attemptDetailQuery = useTestsAdminAttemptsControllerGetAttemptDetail(detailAttemptId ?? 0, {
    query: {
      enabled: Boolean(detailAttemptId),
      refetchInterval: (query) =>
        PENDING_RESULT_KINDS.has(query.state.data?.analysis?.resultKind ?? '')
          ? PENDING_ANALYSIS_POLL_MS
          : false,
    },
  });

  const handleOpenAttemptDetails = (attemptId: number, view: AttemptDetailView) => {
    setDetailAttemptId(attemptId);
    setDetailView(view);
  };
  const handleCloseAttemptDetails = () => {
    setDetailView(null);
    setDetailAttemptId(null);
  };

  return {
    detailView,
    detailAttempt: attemptDetailQuery.data,
    attemptDetailQuery,
    isDetailDialogOpen: detailView !== null,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  };
};

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
