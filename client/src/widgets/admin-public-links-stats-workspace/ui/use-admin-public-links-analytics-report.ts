import { useMemo, useState } from 'react';

import {
  testsAdminAnalyticsControllerExportPdf,
  testsAdminAnalyticsControllerExportXlsx,
  useTestsAdminAnalyticsControllerGetSummary,
} from '@/shared/api/generated/tests/tests';

import { downloadTestAnalyticsBlob } from './test-analytics-download';
import {
  buildAnalyticsFileName,
  buildAnalyticsParams,
} from './use-admin-public-links-stats-workspace.model';

import type {
  AnalyticsExportFormat,
  AnalyticsLinkStatus,
  AnalyticsScope,
} from './use-admin-public-links-stats-workspace.model';
import type {
  TestsAdminAnalyticsControllerExportPdfParams,
  TestsAdminAnalyticsControllerExportXlsxParams,
} from '@/shared/api/model';

export const useAnalyticsReport = (
  effectiveTopicId: number | null,
  effectivePublicLinkId: number | null,
) => {
  const [analyticsScope, setAnalyticsScope] = useState<AnalyticsScope>('TOPIC');
  const [analyticsLinkStatus, setAnalyticsLinkStatus] = useState<AnalyticsLinkStatus>('ALL');
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState('');
  const [analyticsDateTo, setAnalyticsDateTo] = useState('');
  const [analyticsExportFormat, setAnalyticsExportFormat] = useState<AnalyticsExportFormat | null>(
    null,
  );
  const [analyticsExportError, setAnalyticsExportError] = useState<string | null>(null);

  const analyticsParams = useMemo(
    () =>
      buildAnalyticsParams({
        scope: analyticsScope,
        publicLinkId: effectivePublicLinkId,
        linkStatus: analyticsLinkStatus,
        dateFrom: analyticsDateFrom,
        dateTo: analyticsDateTo,
      }),
    [
      analyticsDateFrom,
      analyticsDateTo,
      analyticsLinkStatus,
      analyticsScope,
      effectivePublicLinkId,
    ],
  );
  const isAnalyticsQueryEnabled = Boolean(
    effectiveTopicId && (analyticsScope === 'TOPIC' || effectivePublicLinkId),
  );
  const analyticsSummaryQuery = useTestsAdminAnalyticsControllerGetSummary(
    effectiveTopicId ?? 0,
    analyticsParams,
    { query: { enabled: isAnalyticsQueryEnabled } },
  );

  const clearExportError = () => setAnalyticsExportError(null);
  const handleAnalyticsScopeChange = (scope: AnalyticsScope) => {
    setAnalyticsScope(scope);
    clearExportError();
  };
  const handleAnalyticsLinkStatusChange = (linkStatus: AnalyticsLinkStatus) => {
    setAnalyticsLinkStatus(linkStatus);
    clearExportError();
  };
  const handleAnalyticsDateFromChange = (dateFrom: string) => {
    setAnalyticsDateFrom(dateFrom);
    clearExportError();
  };
  const handleAnalyticsDateToChange = (dateTo: string) => {
    setAnalyticsDateTo(dateTo);
    clearExportError();
  };

  const handleExportAnalytics = async (format: AnalyticsExportFormat) => {
    if (!effectiveTopicId || !isAnalyticsQueryEnabled) {
      return;
    }

    setAnalyticsExportFormat(format);
    setAnalyticsExportError(null);

    try {
      const blob =
        format === 'xlsx'
          ? await testsAdminAnalyticsControllerExportXlsx(
              effectiveTopicId,
              analyticsParams as TestsAdminAnalyticsControllerExportXlsxParams,
            )
          : await testsAdminAnalyticsControllerExportPdf(
              effectiveTopicId,
              analyticsParams as TestsAdminAnalyticsControllerExportPdfParams,
            );

      downloadTestAnalyticsBlob(blob, buildAnalyticsFileName(effectiveTopicId, format));
    } catch {
      setAnalyticsExportError('Не удалось сформировать файл отчета. Попробуйте еще раз.');
    } finally {
      setAnalyticsExportFormat(null);
    }
  };

  return {
    analyticsScope,
    analyticsLinkStatus,
    analyticsDateFrom,
    analyticsDateTo,
    analyticsSummary: analyticsSummaryQuery.data ?? null,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    handleAnalyticsScopeChange,
    handleAnalyticsLinkStatusChange,
    handleAnalyticsDateFromChange,
    handleAnalyticsDateToChange,
    handleExportAnalytics,
  };
};
