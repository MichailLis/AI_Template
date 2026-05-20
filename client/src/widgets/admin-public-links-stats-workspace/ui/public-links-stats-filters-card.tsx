import { BarChart3, ListFilter } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

type PublicLinksTab = 'active' | 'archived';
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

interface PublicLinksStatsFiltersCardProps
  extends LinkNavigationFiltersProps, AnalyticsReportFiltersProps {}

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
    <div className={adminClassNames.panel.section}>
      <div className="mb-3 flex items-center gap-2">
        <ListFilter className="size-4" />
        <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>
          Навигация по ссылкам
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.2fr)_minmax(0,1.1fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="public-link-scope">Область ссылок</Label>
          <select
            id="public-link-scope"
            value={publicLinksTab}
            onChange={(event) => onTabChange(event.target.value as PublicLinksTab)}
            className={`flex ${adminClassNames.form.select}`}
          >
            <option value="active">Активные</option>
            <option value="archived">Архив</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="stats-topic-select">Тест (контекст)</Label>
          <select
            id="stats-topic-select"
            value={effectiveTopicId ? String(effectiveTopicId) : ''}
            onChange={(event) => onTopicChange(Number.parseInt(event.target.value, 10))}
            className={`flex ${adminClassNames.form.select}`}
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
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="stats-link-select">Публичная ссылка (число попыток)</Label>
          <select
            id="stats-link-select"
            value={effectivePublicLinkId ? String(effectivePublicLinkId) : ''}
            onChange={(event) => onPublicLinkChange(Number.parseInt(event.target.value, 10))}
            className={`flex ${adminClassNames.form.select}`}
            disabled={linksForTopic.length === 0}
          >
            {linksForTopic.length === 0 ? (
              <option value="">Нет доступных ссылок для выбранного теста</option>
            ) : null}
            {linksForTopic.map((link) => {
              const attemptsCount = linkAttemptsCountById.get(link.id) ?? 0;

              return (
                <option key={link.id} value={link.id}>
                  {`${link.shortCode} (${attemptsCount})`}
                </option>
              );
            })}
          </select>
        </div>
      </div>
    </div>
  );
}

function AnalyticsReportFilters({
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
    <div className={adminClassNames.panel.section}>
      <div className="mb-3 flex items-center gap-2">
        <BarChart3 className="size-4" />
        <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Параметры отчета</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="analytics-scope-select">Сводка</Label>
          <select
            id="analytics-scope-select"
            value={analyticsScope}
            onChange={(event) => onAnalyticsScopeChange(event.target.value as AnalyticsScope)}
            className={`flex ${adminClassNames.form.select}`}
          >
            <option value="TOPIC">Весь тест</option>
            <option value="PUBLIC_LINK">Выбранная ссылка</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="analytics-link-status-select">Ссылки в отчете</Label>
          <select
            id="analytics-link-status-select"
            value={analyticsLinkStatus}
            onChange={(event) =>
              onAnalyticsLinkStatusChange(event.target.value as AnalyticsLinkStatus)
            }
            className={`flex ${adminClassNames.form.select}`}
          >
            <option value="ALL">Все</option>
            <option value="ACTIVE">Активные</option>
            <option value="ARCHIVED">Архив</option>
          </select>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="analytics-date-from">Дата с</Label>
          <Input
            id="analytics-date-from"
            type="date"
            value={analyticsDateFrom}
            onChange={(event) => onAnalyticsDateFromChange(event.target.value)}
            className="border-admin-border bg-admin-panel"
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="analytics-date-to">Дата по</Label>
          <Input
            id="analytics-date-to"
            type="date"
            value={analyticsDateTo}
            onChange={(event) => onAnalyticsDateToChange(event.target.value)}
            className="border-admin-border bg-admin-panel"
          />
        </div>
      </div>
    </div>
  );
}

export function PublicLinksStatsFiltersCard(props: PublicLinksStatsFiltersCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Статистика публичных ссылок
            </CardTitle>
            <CardDescription>Сначала выберите область, затем тест и ссылку.</CardDescription>
          </div>
          <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
            <Link to="/admin/public-links">Вернуться к управлению ссылками</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <LinkNavigationFilters {...props} />
        <AnalyticsReportFilters {...props} />
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          Сводный отчет использует параметры отчета; таблица прохождений ниже показывает выбранную
          публичную ссылку.
        </p>
      </CardContent>
    </Card>
  );
}
