import { BarChart3, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Label } from '@/shared/ui/label';
import { RuDateInput } from '@/shared/ui/ru-date-input';

import type { ReactNode } from 'react';

type PublicLinksTab = 'active' | 'archived';
type AnalyticsTab = 'report' | 'attempts';
type AnalyticsScope = 'TOPIC' | 'PUBLIC_LINK';
type AnalyticsLinkStatus = 'ALL' | 'ACTIVE' | 'ARCHIVED';

interface TopicOption {
  id: number;
  title: string;
}

interface LinkOption {
  id: number;
  shortCode: string;
}

interface LinkNavigationFiltersProps {
  publicLinksTab: PublicLinksTab;
  onTabChange: (tab: PublicLinksTab) => void;
  topicOptions: TopicOption[];
  effectiveTopicId: number | null;
  onTopicChange: (topicId: number) => void;
  linksForTopic: LinkOption[];
  effectivePublicLinkId: number | null;
  onPublicLinkChange: (linkId: number) => void;
  linkAttemptsCountById: Map<number, number>;
}

interface AnalyticsReportFiltersProps {
  analyticsScope: AnalyticsScope;
  onAnalyticsScopeChange: (scope: AnalyticsScope) => void;
  analyticsLinkStatus: AnalyticsLinkStatus;
  onAnalyticsLinkStatusChange: (linkStatus: AnalyticsLinkStatus) => void;
  analyticsDateFrom: string;
  onAnalyticsDateFromChange: (dateFrom: string) => void;
  analyticsDateTo: string;
  onAnalyticsDateToChange: (dateTo: string) => void;
}

interface AdminAnalyticsNavigationCardProps extends LinkNavigationFiltersProps {
  analyticsTab: AnalyticsTab;
  onAnalyticsTabChange: (tab: AnalyticsTab) => void;
  /** Поля, которые действуют только на текущую вкладку; встают в тот же блок фильтров. */
  reportFilters?: ReactNode;
}

export const ANALYTICS_PANEL_ID = 'admin-analytics-panel';
const ANALYTICS_FILTERS_HEADING_ID = 'admin-analytics-filters-heading';

const ANALYTICS_TABS: Array<{ value: AnalyticsTab; label: string }> = [
  { value: 'report', label: 'Сводный отчет' },
  { value: 'attempts', label: 'Прохождения' },
];

const ANALYTICS_TAB_HINTS: Record<AnalyticsTab, string> = {
  report: 'Отчет строится по выбранному тесту целиком или по одной публичной ссылке.',
  attempts: 'Показаны прохождения выбранной публичной ссылки.',
};

function LinkNavigationFilters({
  publicLinksTab,
  onTabChange,
  topicOptions,
  effectiveTopicId,
  onTopicChange,
  linksForTopic,
  effectivePublicLinkId,
  onPublicLinkChange,
  linkAttemptsCountById,
}: LinkNavigationFiltersProps) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.2fr)_minmax(0,1.1fr)]">
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="public-link-scope">Область ссылок</Label>
        <AdminSelectField
          id="public-link-scope"
          value={publicLinksTab}
          onChange={(event) => onTabChange(event.target.value as PublicLinksTab)}
          className="flex"
        >
          <option value="active">Активные</option>
          <option value="archived">Архив</option>
        </AdminSelectField>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="stats-topic-select">Тест</Label>
        <AdminSelectField
          id="stats-topic-select"
          value={effectiveTopicId ? String(effectiveTopicId) : ''}
          onChange={(event) => onTopicChange(Number.parseInt(event.target.value, 10))}
          className="flex"
          disabled={topicOptions.length === 0}
        >
          {topicOptions.length === 0 ? (
            <option value="">Нет доступных тестов в выбранной области</option>
          ) : null}
          {topicOptions.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.title}
            </option>
          ))}
        </AdminSelectField>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="stats-link-select">Публичная ссылка</Label>
        <AdminSelectField
          id="stats-link-select"
          value={effectivePublicLinkId ? String(effectivePublicLinkId) : ''}
          onChange={(event) => onPublicLinkChange(Number.parseInt(event.target.value, 10))}
          className="flex"
          disabled={linksForTopic.length === 0}
        >
          {linksForTopic.length === 0 ? (
            <option value="">Нет доступных ссылок для выбранного теста</option>
          ) : null}
          {linksForTopic.map((link) => {
            const attemptsCount = linkAttemptsCountById.get(link.id) ?? 0;

            return (
              <option key={link.id} value={link.id}>
                {`${link.shortCode} — ${attemptsCount} попыток`}
              </option>
            );
          })}
        </AdminSelectField>
      </div>
    </div>
  );
}

/**
 * Параметры сводного отчёта. «Ссылки в отчете» есть только у отчёта по всему тесту: отчёт по одной
 * ссылке не сужается по её статусу, иначе архивная ссылка давала пустой отчёт.
 */
export function AnalyticsReportFilterFields({
  analyticsScope,
  onAnalyticsScopeChange,
  analyticsLinkStatus,
  onAnalyticsLinkStatusChange,
  analyticsDateFrom,
  onAnalyticsDateFromChange,
  analyticsDateTo,
  onAnalyticsDateToChange,
}: AnalyticsReportFiltersProps) {
  return (
    <div className="grid gap-3 border-t border-admin-border pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="analytics-scope-select">Сводка</Label>
        <AdminSelectField
          id="analytics-scope-select"
          value={analyticsScope}
          onChange={(event) => onAnalyticsScopeChange(event.target.value as AnalyticsScope)}
          className="flex"
        >
          <option value="TOPIC">Весь тест</option>
          <option value="PUBLIC_LINK">Выбранная ссылка</option>
        </AdminSelectField>
      </div>

      {analyticsScope === 'TOPIC' ? (
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="analytics-link-status-select">Ссылки в отчете</Label>
          <AdminSelectField
            id="analytics-link-status-select"
            value={analyticsLinkStatus}
            onChange={(event) =>
              onAnalyticsLinkStatusChange(event.target.value as AnalyticsLinkStatus)
            }
            className="flex"
          >
            <option value="ALL">Все</option>
            <option value="ACTIVE">Активные</option>
            <option value="ARCHIVED">Архив</option>
          </AdminSelectField>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="analytics-date-from">Дата с</Label>
        <RuDateInput
          id="analytics-date-from"
          value={analyticsDateFrom}
          onChange={onAnalyticsDateFromChange}
          className="border-admin-border bg-admin-panel"
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Label htmlFor="analytics-date-to">Дата по</Label>
        <RuDateInput
          id="analytics-date-to"
          value={analyticsDateTo}
          onChange={onAnalyticsDateToChange}
          className="border-admin-border bg-admin-panel"
        />
      </div>
    </div>
  );
}

export function AdminAnalyticsNavigationCard({
  analyticsTab,
  onAnalyticsTabChange,
  reportFilters,
  ...navigationProps
}: AdminAnalyticsNavigationCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="flex flex-col gap-4 pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Аналитика тестов
            </CardTitle>
            <CardDescription>
              Выберите область, тест и ссылку — они действуют на обеих вкладках.
            </CardDescription>
          </div>
          <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
            <Link to="/admin/public-links">Управление ссылками</Link>
          </Button>
        </div>

        <AdminTabs
          ariaLabel="Разделы аналитики"
          tabs={ANALYTICS_TABS}
          activeTab={analyticsTab}
          onTabChange={onAnalyticsTabChange}
          panelId={ANALYTICS_PANEL_ID}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <section
          aria-labelledby={ANALYTICS_FILTERS_HEADING_ID}
          className={`flex flex-col gap-3 ${adminClassNames.panel.section}`}
        >
          <div className="flex items-center gap-2">
            <ListFilter className="size-4" />
            <h3
              id={ANALYTICS_FILTERS_HEADING_ID}
              className={`text-sm font-medium ${adminClassNames.text.heading}`}
            >
              Фильтры
            </h3>
          </div>
          <LinkNavigationFilters {...navigationProps} />
          {reportFilters}
        </section>
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          {ANALYTICS_TAB_HINTS[analyticsTab]}
        </p>
      </CardContent>
    </Card>
  );
}
