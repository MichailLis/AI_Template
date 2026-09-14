import { useSearchParams } from 'react-router-dom';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSkeletonRows } from '@/shared/ui/admin-skeleton';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { getAdminTabPanelProps } from '@/shared/ui/admin-tabs.model';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

import {
  ANALYTICS_PANEL_ID,
  AdminAnalyticsNavigationCard,
  AnalyticsReportFilterFields,
} from './admin-analytics-filters';
import { AnalyticsAttemptsTab } from './analytics-attempts-tab';
import { AnalyticsReportTab } from './analytics-report-tab';
import { useAnalyticsReport } from './use-admin-public-links-analytics-report';
import { usePublicLinkSelection, usePublicLinksData } from './use-admin-public-links-selection';
import { resolveAnalyticsTab } from './use-admin-public-links-stats-workspace.model';

import type { AnalyticsTab } from './use-admin-public-links-stats-workspace.model';

export function AdminAnalyticsWorkspace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const analyticsTab = resolveAnalyticsTab(searchParams.get('tab'));

  const {
    activePublicLinks,
    archivedPublicLinks,
    isPublicLinksError,
    isPublicLinksLoading,
    refetchPublicLinks,
  } = usePublicLinksData();
  const {
    publicLinksTab,
    topicOptions,
    effectiveTopicId,
    linksForTopic,
    effectivePublicLinkId,
    linkAttemptsCountById,
    selectedPublicLink,
    attemptsPage,
    attemptsLimit,
    setAttemptsPage,
    setAttemptsLimit,
    setSelectedPublicLinkId,
    handleTabChange,
    handleTopicChange,
  } = usePublicLinkSelection(activePublicLinks, archivedPublicLinks);
  // Параметры отчёта живут здесь, а не во вкладке: их поля стоят в общем блоке фильтров и
  // сохраняются при переключении вкладок. Сам отчёт запрашивается только на своей вкладке.
  const analyticsReport = useAnalyticsReport(
    effectiveTopicId,
    effectivePublicLinkId,
    analyticsTab === 'report',
  );

  const handleAnalyticsTabChange = (tab: AnalyticsTab) => {
    setSearchParams(tab === 'attempts' ? { tab: 'attempts' } : {}, { replace: true });
  };

  if (isPublicLinksLoading) {
    return (
      <Card className={adminClassNames.panel.card}>
        <CardContent className="p-4">
          <AdminSkeletonRows rows={3} columns={3} label="Загружаем публичные ссылки" />
        </CardContent>
      </Card>
    );
  }

  if (isPublicLinksError) {
    return (
      <Card className={adminClassNames.panel.errorCard}>
        <CardContent className="p-4">
          <AdminStateBlock
            tone="danger"
            action={
              <Button type="button" size="sm" variant="outline" onClick={refetchPublicLinks}>
                Повторить
              </Button>
            }
          >
            Не удалось загрузить публичные ссылки, поэтому аналитику не по чему построить. Проверьте
            подключение и повторите попытку.
          </AdminStateBlock>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={adminClassNames.layout.page}>
      <AdminAnalyticsNavigationCard
        analyticsTab={analyticsTab}
        onAnalyticsTabChange={handleAnalyticsTabChange}
        publicLinksTab={publicLinksTab}
        onTabChange={handleTabChange}
        topicOptions={topicOptions}
        effectiveTopicId={effectiveTopicId}
        onTopicChange={handleTopicChange}
        linksForTopic={linksForTopic}
        effectivePublicLinkId={effectivePublicLinkId}
        onPublicLinkChange={setSelectedPublicLinkId}
        linkAttemptsCountById={linkAttemptsCountById}
        reportFilters={
          analyticsTab === 'report' ? (
            <AnalyticsReportFilterFields
              analyticsScope={analyticsReport.analyticsScope}
              onAnalyticsScopeChange={analyticsReport.handleAnalyticsScopeChange}
              analyticsLinkStatus={analyticsReport.analyticsLinkStatus}
              onAnalyticsLinkStatusChange={analyticsReport.handleAnalyticsLinkStatusChange}
              analyticsDateFrom={analyticsReport.analyticsDateFrom}
              onAnalyticsDateFromChange={analyticsReport.handleAnalyticsDateFromChange}
              analyticsDateTo={analyticsReport.analyticsDateTo}
              onAnalyticsDateToChange={analyticsReport.handleAnalyticsDateToChange}
            />
          ) : null
        }
      />

      <div
        {...getAdminTabPanelProps(ANALYTICS_PANEL_ID, analyticsTab)}
        className={adminClassNames.layout.page}
      >
        {analyticsTab === 'report' ? (
          <AnalyticsReportTab report={analyticsReport} />
        ) : (
          <AnalyticsAttemptsTab
            selectedPublicLink={selectedPublicLink}
            effectivePublicLinkId={effectivePublicLinkId}
            attemptsPage={attemptsPage}
            attemptsLimit={attemptsLimit}
            setAttemptsPage={setAttemptsPage}
            setAttemptsLimit={setAttemptsLimit}
          />
        )}
      </div>
    </div>
  );
}
