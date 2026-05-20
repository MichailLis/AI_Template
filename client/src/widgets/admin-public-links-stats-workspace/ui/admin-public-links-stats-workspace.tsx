import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';
import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';
import { PublicLinksStatsFiltersCard } from './public-links-stats-filters-card';
import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';
import { TestAnalyticsExportActions } from './test-analytics-export-actions';
import { TestAnalyticsSummaryCard } from './test-analytics-summary-card';
import { useAdminPublicLinksStatsWorkspace } from './use-admin-public-links-stats-workspace';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

const toPrettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AdminPublicLinksStatsWorkspace() {
  const {
    publicLinksTab,
    topicOptions,
    effectiveTopicId,
    linksForTopic,
    effectivePublicLinkId,
    linkAttemptsCountById,
    selectedPublicLink,
    analyticsScope,
    analyticsLinkStatus,
    analyticsDateFrom,
    analyticsDateTo,
    analyticsSummary,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    publicAttempts,
    publicAttemptsPage,
    publicAttemptsTotal,
    publicAttemptsTotalPages,
    publicAttemptsQuery,
    detailView,
    detailAttempt,
    attemptDetailQuery,
    isDetailDialogOpen,
    setSelectedPublicLinkId,
    handleTabChange,
    handleTopicChange,
    handleAnalyticsScopeChange,
    handleAnalyticsLinkStatusChange,
    handleAnalyticsDateFromChange,
    handleAnalyticsDateToChange,
    handleExportAnalytics,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
    handlePreviousAttemptsPage,
    handleNextAttemptsPage,
  } = useAdminPublicLinksStatsWorkspace();

  return (
    <div className="flex flex-col gap-4">
      <PublicLinksStatsFiltersCard
        publicLinksTab={publicLinksTab}
        onTabChange={handleTabChange}
        topicOptions={topicOptions}
        effectiveTopicId={effectiveTopicId}
        onTopicChange={handleTopicChange}
        linksForTopic={linksForTopic}
        effectivePublicLinkId={effectivePublicLinkId}
        onPublicLinkChange={setSelectedPublicLinkId}
        linkAttemptsCountById={linkAttemptsCountById}
        analyticsScope={analyticsScope}
        onAnalyticsScopeChange={handleAnalyticsScopeChange}
        analyticsLinkStatus={analyticsLinkStatus}
        onAnalyticsLinkStatusChange={handleAnalyticsLinkStatusChange}
        analyticsDateFrom={analyticsDateFrom}
        onAnalyticsDateFromChange={handleAnalyticsDateFromChange}
        analyticsDateTo={analyticsDateTo}
        onAnalyticsDateToChange={handleAnalyticsDateToChange}
      />

      <TestAnalyticsSummaryCard
        summary={analyticsSummary}
        isLoading={analyticsSummaryQuery.isLoading}
        isFetching={analyticsSummaryQuery.isFetching}
        isEnabled={isAnalyticsQueryEnabled}
        isError={analyticsSummaryQuery.isError}
        actions={
          <TestAnalyticsExportActions
            canExport={Boolean(analyticsSummary) && isAnalyticsQueryEnabled}
            exportingFormat={analyticsExportFormat}
            error={analyticsExportError}
            onExport={handleExportAnalytics}
          />
        }
      />

      <TestAnalyticsBreakdownTables summary={analyticsSummary} formatDateTime={formatDateTime} />

      <PublicLinksAttemptsTableCard
        selectedPublicLink={selectedPublicLink}
        publicAttempts={publicAttempts}
        isLoading={publicAttemptsQuery.isLoading}
        isFetching={publicAttemptsQuery.isFetching}
        page={publicAttemptsPage}
        total={publicAttemptsTotal}
        totalPages={publicAttemptsTotalPages}
        formatDateTime={formatDateTime}
        onOpenAttemptDetails={handleOpenAttemptDetails}
        onPreviousPage={handlePreviousAttemptsPage}
        onNextPage={handleNextAttemptsPage}
      />

      <PublicLinksAttemptDetailDialog
        isOpen={isDetailDialogOpen}
        detailView={detailView}
        detailAttempt={detailAttempt ?? null}
        isLoading={attemptDetailQuery.isLoading}
        onClose={handleCloseAttemptDetails}
        formatDateTime={formatDateTime}
        toPrettyJson={toPrettyJson}
      />
    </div>
  );
}
