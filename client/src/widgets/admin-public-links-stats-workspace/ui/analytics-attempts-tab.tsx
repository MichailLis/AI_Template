import { formatDateTimeOrDash, formatDateTimePreciseOrDash } from '@/shared/lib/date-format';

import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';
import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';
import { useAttemptDetail, usePaginatedPublicAttempts } from './use-admin-public-links-attempts';

interface AnalyticsAttemptsTabProps {
  selectedPublicLink: { id: number } | null;
  effectivePublicLinkId: number | null;
  attemptsPage: number;
  attemptsLimit: number;
  setAttemptsPage: (updater: (previous: number) => number) => void;
  setAttemptsLimit: (limit: number) => void;
}

const toPrettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AnalyticsAttemptsTab({
  selectedPublicLink,
  effectivePublicLinkId,
  attemptsPage,
  attemptsLimit,
  setAttemptsPage,
  setAttemptsLimit,
}: AnalyticsAttemptsTabProps) {
  const {
    publicAttempts,
    publicAttemptsPage,
    publicAttemptsQuery,
    publicAttemptsTotal,
    publicAttemptsTotalPages,
  } = usePaginatedPublicAttempts(effectivePublicLinkId, attemptsPage, attemptsLimit);
  const {
    detailView,
    detailAttempt,
    attemptDetailQuery,
    isDetailDialogOpen,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  } = useAttemptDetail();

  const handlePreviousAttemptsPage = () => {
    setAttemptsPage((previous) => Math.max(1, previous - 1));
  };
  const handleNextAttemptsPage = () => {
    setAttemptsPage((previous) => Math.min(publicAttemptsTotalPages, previous + 1));
  };

  return (
    <>
      <PublicLinksAttemptsTableCard
        selectedPublicLink={selectedPublicLink}
        publicAttempts={publicAttempts}
        isLoading={publicAttemptsQuery.isLoading}
        isFetching={publicAttemptsQuery.isFetching}
        page={publicAttemptsPage}
        pageSize={attemptsLimit}
        total={publicAttemptsTotal}
        totalPages={publicAttemptsTotalPages}
        formatDateTime={formatDateTimeOrDash}
        onOpenAttemptDetails={handleOpenAttemptDetails}
        onPreviousPage={handlePreviousAttemptsPage}
        onNextPage={handleNextAttemptsPage}
        onPageSizeChange={setAttemptsLimit}
      />

      {/* В карточке прохождения секунды нужны: админ разбирает конкретную попытку. В таблице они
          только мешают сканировать столбец, поэтому там формат без секунд. */}
      <PublicLinksAttemptDetailDialog
        isOpen={isDetailDialogOpen}
        detailView={detailView}
        detailAttempt={detailAttempt ?? null}
        isLoading={attemptDetailQuery.isLoading}
        onClose={handleCloseAttemptDetails}
        formatDateTime={formatDateTimePreciseOrDash}
        toPrettyJson={toPrettyJson}
      />
    </>
  );
}
