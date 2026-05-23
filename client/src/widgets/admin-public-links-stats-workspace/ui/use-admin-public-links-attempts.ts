import { useMemo, useState } from 'react';

import {
  useTestsAdminAttemptsControllerGetAttemptDetail,
  useTestsAdminAttemptsControllerListPublicLinkAttempts,
} from '@/shared/api/generated/tests/tests';

import { ATTEMPTS_LIMIT } from './use-admin-public-links-stats-workspace.model';

import type { AttemptDetailView } from './use-admin-public-links-stats-workspace.model';

export const usePaginatedPublicAttempts = (
  effectivePublicLinkId: number | null,
  attemptsPage: number,
) => {
  const publicAttemptsQuery = useTestsAdminAttemptsControllerListPublicLinkAttempts(
    effectivePublicLinkId ?? 0,
    { page: attemptsPage, limit: ATTEMPTS_LIMIT },
    { query: { enabled: Boolean(effectivePublicLinkId) } },
  );
  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  return {
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
    query: { enabled: Boolean(detailAttemptId) },
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
