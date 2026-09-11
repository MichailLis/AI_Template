import { formatDateTimeOrDash } from '@/shared/lib/date-format';

import { AnalyticsReportFiltersSection } from './admin-analytics-filters';
import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';
import { TestAnalyticsExportActions } from './test-analytics-export-actions';
import { TestAnalyticsSummaryCard } from './test-analytics-summary-card';
import { useAnalyticsReport } from './use-admin-public-links-analytics-report';

interface AnalyticsReportTabProps {
  effectiveTopicId: number | null;
  effectivePublicLinkId: number | null;
}

export function AnalyticsReportTab({
  effectiveTopicId,
  effectivePublicLinkId,
}: AnalyticsReportTabProps) {
  const {
    analyticsScope,
    analyticsLinkStatus,
    analyticsDateFrom,
    analyticsDateTo,
    analyticsSummary,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    handleAnalyticsScopeChange,
    handleAnalyticsLinkStatusChange,
    handleAnalyticsDateFromChange,
    handleAnalyticsDateToChange,
    handleExportAnalytics,
  } = useAnalyticsReport(effectiveTopicId, effectivePublicLinkId);

  return (
    <>
      <AnalyticsReportFiltersSection
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
    </>
  );
}
