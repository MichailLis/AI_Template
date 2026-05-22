import { formatDateTimeOrDash } from '@/shared/lib/date-format';

import { TestAnalyticsReportFiltersCard } from './public-links-stats-filters-card';
import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';
import { TestAnalyticsExportActions } from './test-analytics-export-actions';
import { TestAnalyticsSummaryCard } from './test-analytics-summary-card';
import { useAdminTestAnalyticsReportWorkspace } from './use-admin-public-links-stats-workspace';

export function AdminTestAnalyticsReportWorkspace() {
  const {
    publicLinksTab,
    topicOptions,
    effectiveTopicId,
    linksForTopic,
    effectivePublicLinkId,
    linkAttemptsCountById,
    analyticsScope,
    analyticsLinkStatus,
    analyticsDateFrom,
    analyticsDateTo,
    analyticsSummary,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    setSelectedPublicLinkId,
    handleTabChange,
    handleTopicChange,
    handleAnalyticsScopeChange,
    handleAnalyticsLinkStatusChange,
    handleAnalyticsDateFromChange,
    handleAnalyticsDateToChange,
    handleExportAnalytics,
  } = useAdminTestAnalyticsReportWorkspace();

  return (
    <div className="flex flex-col gap-4">
      <TestAnalyticsReportFiltersCard
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

      <TestAnalyticsBreakdownTables
        summary={analyticsSummary}
        formatDateTime={formatDateTimeOrDash}
      />
    </div>
  );
}
