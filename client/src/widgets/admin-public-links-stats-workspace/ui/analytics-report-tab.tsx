import { formatDateTimeOrDash } from '@/shared/lib/date-format';

import { TestAnalyticsBreakdownTables } from './test-analytics-breakdown-table';
import { TestAnalyticsExportActions } from './test-analytics-export-actions';
import { TestAnalyticsSummaryCard } from './test-analytics-summary-card';

import type { useAnalyticsReport } from './use-admin-public-links-analytics-report';

interface AnalyticsReportTabProps {
  /** Состояние отчёта поднято в рабочую область: его поля стоят в общем блоке фильтров. */
  report: ReturnType<typeof useAnalyticsReport>;
}

export function AnalyticsReportTab({ report }: AnalyticsReportTabProps) {
  const {
    analyticsSummary,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    handleExportAnalytics,
  } = report;

  return (
    <>
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
