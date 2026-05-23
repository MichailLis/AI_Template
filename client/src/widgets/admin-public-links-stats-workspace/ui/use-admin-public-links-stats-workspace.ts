import { useAnalyticsReport } from './use-admin-public-links-analytics-report';
import { useAttemptDetail, usePaginatedPublicAttempts } from './use-admin-public-links-attempts';
import { usePublicLinkSelection, usePublicLinksData } from './use-admin-public-links-selection';

export function useAdminPublicLinksStatsWorkspace() {
  const { activePublicLinks, archivedPublicLinks } = usePublicLinksData();
  const selection = usePublicLinkSelection(activePublicLinks, archivedPublicLinks);
  const attempts = usePaginatedPublicAttempts(
    selection.effectivePublicLinkId,
    selection.attemptsPage,
  );
  const detail = useAttemptDetail();

  const handlePreviousAttemptsPage = () => {
    selection.setAttemptsPage((previous) => Math.max(1, previous - 1));
  };
  const handleNextAttemptsPage = () => {
    selection.setAttemptsPage((previous) =>
      Math.min(attempts.publicAttemptsTotalPages, previous + 1),
    );
  };

  return {
    ...selection,
    ...attempts,
    ...detail,
    handlePreviousAttemptsPage,
    handleNextAttemptsPage,
  };
}

export function useAdminTestAnalyticsReportWorkspace() {
  const { activePublicLinks, archivedPublicLinks } = usePublicLinksData();
  const selection = usePublicLinkSelection(activePublicLinks, archivedPublicLinks);
  const analytics = useAnalyticsReport(selection.effectiveTopicId, selection.effectivePublicLinkId);

  return {
    ...selection,
    ...analytics,
  };
}
