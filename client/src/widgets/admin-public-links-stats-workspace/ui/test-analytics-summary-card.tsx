import { AlertTriangle, BarChart3, Brain, CheckCircle2, Link2, Users } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
  type AdminTone,
} from '@/shared/ui/admin-design-tokens';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';
import type { ReactNode } from 'react';

interface TestAnalyticsSummaryCardProps {
  summary: AdminTestAnalyticsSummaryDto | null;
  isLoading: boolean;
  isFetching: boolean;
  isEnabled: boolean;
  isError: boolean;
  actions: ReactNode;
}

interface MetricItem {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: AdminTone;
  icon: typeof Link2;
}

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
const formatShare = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)}%`;

const toShare = (count: number, total: number) => {
  if (total === 0) {
    return 0;
  }

  return Math.round((count / total) * 1000) / 10;
};

const getMetrics = (summary: AdminTestAnalyticsSummaryDto): MetricItem[] => {
  const coverage = summary.coverage;

  return [
    {
      id: 'links',
      label: 'Публичные ссылки',
      value: formatNumber(coverage.publicLinks),
      hint: 'в выбранной области',
      tone: 'info',
      icon: Link2,
    },
    {
      id: 'attempts',
      label: 'Прохождения',
      value: formatNumber(coverage.attemptsTotal),
      hint: `${formatShare(toShare(coverage.attemptsCompleted, coverage.attemptsTotal))} завершено`,
      tone: 'accent',
      icon: Users,
    },
    {
      id: 'analysis',
      label: 'Готовый анализ',
      value: formatNumber(coverage.analysisReady),
      hint: `${formatShare(toShare(coverage.analysisReady, coverage.attemptsTotal))} от попыток`,
      tone: 'success',
      icon: CheckCircle2,
    },
    {
      id: 'v3',
      label: 'V3+ результаты',
      value: formatNumber(coverage.v3Results),
      hint: `${formatShare(toShare(coverage.v3Results, coverage.analysisReady))} от готового анализа`,
      tone: 'warning',
      icon: Brain,
    },
  ];
};

function MetricCard({ item }: { item: MetricItem }) {
  const tone = adminToneClassNames[item.tone];
  const Icon = item.icon;

  return (
    <div className={cn('rounded-md border p-3', tone.border, tone.surface)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn('text-sm font-medium', adminClassNames.text.body)}>{item.label}</p>
          <p className={cn('mt-1 text-2xl font-semibold', adminClassNames.text.heading)}>
            {item.value}
          </p>
        </div>
        <span className={cn('grid size-9 place-items-center rounded-lg', tone.icon)}>
          <Icon className="size-4" />
        </span>
      </div>
      <p className={cn('mt-2 text-xs', adminClassNames.text.muted)}>{item.hint}</p>
    </div>
  );
}

function SummaryHighlights({ summary }: { summary: AdminTestAnalyticsSummaryDto }) {
  const topDirection = summary.directions[0];
  const topProfile = summary.profiles[0];
  const topFlag = summary.flags[0];

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      <div className={adminClassNames.panel.compactSection}>
        <p
          className={cn('text-xs font-medium uppercase tracking-wide', adminClassNames.text.label)}
        >
          Лидирующее направление
        </p>
        <p className={cn('mt-2 text-sm font-semibold', adminClassNames.text.heading)}>
          {topDirection ? topDirection.label : 'Нет данных V3+'}
        </p>
        <p className={cn('mt-1 text-sm', adminClassNames.text.muted)}>
          {topDirection
            ? `${formatNumber(topDirection.count)} / ${formatShare(topDirection.share)}`
            : 'Дождитесь готового анализа'}
        </p>
      </div>
      <div className={adminClassNames.panel.compactSection}>
        <p
          className={cn('text-xs font-medium uppercase tracking-wide', adminClassNames.text.label)}
        >
          Частый профиль
        </p>
        <p className={cn('mt-2 text-sm font-semibold', adminClassNames.text.heading)}>
          {topProfile ? topProfile.profileType : 'Нет данных V3+'}
        </p>
        <p className={cn('mt-1 text-sm', adminClassNames.text.muted)}>
          {topProfile
            ? `${formatNumber(topProfile.count)} / ${formatShare(topProfile.share)}`
            : 'Профили появятся после анализа'}
        </p>
      </div>
      <div className={adminClassNames.panel.compactSection}>
        <p
          className={cn('text-xs font-medium uppercase tracking-wide', adminClassNames.text.label)}
        >
          Сигналы качества
        </p>
        <p className={cn('mt-2 text-sm font-semibold', adminClassNames.text.heading)}>
          {topFlag ? topFlag.flag : 'Без флагов'}
        </p>
        <p className={cn('mt-1 text-sm', adminClassNames.text.muted)}>
          {topFlag
            ? `${formatNumber(topFlag.count)} / ${formatShare(topFlag.share)}`
            : `Средний gap: ${formatShare(summary.confidence.gap.value)}`}
        </p>
      </div>
    </div>
  );
}

export function TestAnalyticsSummaryCard({
  summary,
  isLoading,
  isFetching,
  isEnabled,
  isError,
  actions,
}: TestAnalyticsSummaryCardProps) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="size-4" />
              Сводный аналитический отчет
            </CardTitle>
            <CardDescription>
              {summary
                ? `${summary.topic.title} · сформировано ${new Date(
                    summary.topic.generatedAt,
                  ).toLocaleString()}`
                : 'Агрегация результатов по методике V3+'}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 lg:items-end">
            {isFetching && summary ? (
              <Badge variant="outline" className={adminBadgeClassNames.notice}>
                Обновляется
              </Badge>
            ) : null}
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {!isEnabled ? (
          <AdminStateBlock>
            Выберите тест для сводного отчета. Для среза по отдельной ссылке выберите публичную
            ссылку.
          </AdminStateBlock>
        ) : null}

        {isEnabled && isLoading ? (
          <AdminStateBlock>Загружаем сводный отчет...</AdminStateBlock>
        ) : null}

        {isEnabled && isError ? (
          <AdminStateBlock tone="danger">
            <span className="inline-flex items-center gap-2">
              <AlertTriangle className="size-4" />
              Не удалось загрузить сводный отчет.
            </span>
          </AdminStateBlock>
        ) : null}

        {summary ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {getMetrics(summary).map((item) => (
                <MetricCard key={item.id} item={item} />
              ))}
            </div>
            <SummaryHighlights summary={summary} />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
