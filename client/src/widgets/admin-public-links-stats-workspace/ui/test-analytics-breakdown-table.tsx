import { ListChecks, Rows3, TableProperties } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { AdminDataTable } from '@/shared/ui/admin-data-table';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { TableCell } from '@/shared/ui/table';

import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';

interface BreakdownRow {
  id: string;
  label: string;
  value: string;
  share?: number;
  note?: string;
}

interface TestAnalyticsBreakdownTableProps {
  title: string;
  description: string;
  rows: BreakdownRow[];
  valueHeader?: string;
  emptyMessage: string;
}

const formatNumber = (value: number) => new Intl.NumberFormat('ru-RU').format(value);
const formatShare = (value: number) => `${new Intl.NumberFormat('ru-RU').format(value)}%`;

const BREAKDOWN_COLUMNS = [
  { id: 'label', header: 'Показатель', className: 'min-w-64' },
  { id: 'value', header: 'Значение', className: 'whitespace-nowrap' },
  { id: 'share', header: 'Доля', className: 'whitespace-nowrap text-right' },
];

const ATTEMPTS_COLUMNS = [
  { id: 'attempt', header: 'ID', className: 'whitespace-nowrap' },
  { id: 'link', header: 'Ссылка', className: 'whitespace-nowrap' },
  { id: 'status', header: 'Статус', className: 'whitespace-nowrap' },
  { id: 'analysis', header: 'Анализ', className: 'whitespace-nowrap' },
  { id: 'started', header: 'Начало', className: 'whitespace-nowrap' },
  { id: 'finished', header: 'Завершение', className: 'whitespace-nowrap' },
];

function TestAnalyticsBreakdownTable({
  title,
  description,
  rows,
  valueHeader = 'Количество',
  emptyMessage,
}: TestAnalyticsBreakdownTableProps) {
  const columns = BREAKDOWN_COLUMNS.map((column) =>
    column.id === 'value' ? { ...column, header: valueHeader } : column,
  );

  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Rows3 className="size-4" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminDataTable
          columns={columns}
          items={rows}
          getRowKey={(row) => row.id}
          emptyMessage={emptyMessage}
          renderRow={(row) => (
            <>
              <TableCell className="min-w-64">
                <div className="flex flex-col gap-1">
                  <span className={cn('font-medium', adminClassNames.text.heading)}>
                    {row.label}
                  </span>
                  {row.note ? (
                    <span className={cn('text-xs', adminClassNames.text.muted)}>{row.note}</span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">{row.value}</TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {row.share != null ? (
                  <Badge variant="outline" className={adminBadgeClassNames.fresh}>
                    {formatShare(row.share)}
                  </Badge>
                ) : (
                  '—'
                )}
              </TableCell>
            </>
          )}
        />
      </CardContent>
    </Card>
  );
}

const buildDirectionRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] =>
  summary.directions.map((item) => ({
    id: item.id,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
  }));

const buildProfileRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] => [
  ...summary.profiles.map((item) => ({
    id: `profile-${item.profileType}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Профиль результата',
  })),
  ...summary.confidence.levels.map((item) => ({
    id: `confidence-${item.label}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Уровень уверенности',
  })),
  ...summary.flags.map((item) => ({
    id: `flag-${item.flag}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Флаг качества',
  })),
];

const buildScoreRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] => [
  ...summary.scoreAverages.map((item) => ({
    id: `score-${item.id}`,
    label: item.label,
    value: formatShare(item.average),
    note: 'Средний балл',
  })),
  ...summary.directionPairs.map((item) => ({
    id: `pair-${item.primaryDirectionId}-${item.secondaryDirectionId}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Пара направлений',
  })),
];

const buildPublicLinkRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] =>
  summary.publicLinks.map((item) => ({
    id: `link-${item.publicLinkId}`,
    label: `${item.shortCode} · ${item.title}`,
    value: `${formatNumber(item.attemptsTotal)} / ${formatNumber(item.attemptsCompleted)}`,
    share: item.share,
    note: `${formatNumber(item.analysisReady)} готовых анализов${
      item.archivedAt ? ' · архив' : ''
    }`,
  }));

const buildGroupRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] =>
  summary.groups.map((item, index) => ({
    id: `group-${index}`,
    label: [item.educationOrganization, item.groupOrClass].filter(Boolean).join(' · ') || '—',
    value: `${formatNumber(item.attemptsTotal)} / ${formatNumber(item.attemptsCompleted)}`,
    share: item.share,
  }));

const buildDemographicRows = (summary: AdminTestAnalyticsSummaryDto): BreakdownRow[] => [
  ...summary.demographics.gender.map((item) => ({
    id: `gender-${item.label}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Пол',
  })),
  ...summary.demographics.ageRange.map((item) => ({
    id: `age-${item.label}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Возраст',
  })),
  ...summary.demographics.educationLevel.map((item) => ({
    id: `education-${item.label}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Образование',
  })),
  ...summary.demographics.residence.map((item) => ({
    id: `residence-${item.label}`,
    label: item.label,
    value: formatNumber(item.count),
    share: item.share,
    note: 'Место проживания',
  })),
];

function TestAnalyticsAttemptsTable({
  summary,
  formatDateTime,
}: {
  summary: AdminTestAnalyticsSummaryDto;
  formatDateTime: (value: string | null) => string;
}) {
  const attempts = summary.attempts.slice(0, 12);

  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TableProperties className="size-4" />
          Прохождения в отчете
        </CardTitle>
        <CardDescription>Последние записи из текущей выборки.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminDataTable
          columns={ATTEMPTS_COLUMNS}
          items={attempts}
          getRowKey={(attempt) => attempt.attemptId}
          emptyMessage="В выбранной выборке пока нет прохождений."
          renderRow={(attempt) => (
            <>
              <TableCell className="whitespace-nowrap">{attempt.attemptId}</TableCell>
              <TableCell className="whitespace-nowrap">{attempt.shortCode}</TableCell>
              <TableCell className="whitespace-nowrap">{attempt.status}</TableCell>
              <TableCell className="whitespace-nowrap">
                {attempt.analysisStatus ?? 'NONE'}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(attempt.startedAt)}
              </TableCell>
              <TableCell className="whitespace-nowrap">
                {formatDateTime(attempt.finishedAt)}
              </TableCell>
            </>
          )}
        />
      </CardContent>
    </Card>
  );
}

export function TestAnalyticsBreakdownTables({
  summary,
  formatDateTime,
}: {
  summary: AdminTestAnalyticsSummaryDto | null;
  formatDateTime: (value: string | null) => string;
}) {
  if (!summary) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <TestAnalyticsBreakdownTable
          title="Направления V3+"
          description="Распределение первичных направлений."
          rows={buildDirectionRows(summary)}
          emptyMessage="Нет готовых V3+ результатов для распределения направлений."
        />
        <TestAnalyticsBreakdownTable
          title="Баллы и пары"
          description="Средние значения по шкалам и частые пары направлений."
          rows={buildScoreRows(summary)}
          valueHeader="Значение"
          emptyMessage="Нет данных по шкалам и парам направлений."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <TestAnalyticsBreakdownTable
          title="Профили и флаги"
          description="Типы профилей, уровни уверенности и сигналы качества."
          rows={buildProfileRows(summary)}
          emptyMessage="Нет профилей, уровней уверенности или флагов."
        />
        <TestAnalyticsBreakdownTable
          title="Демография и группы"
          description="Срезы по анкетным и образовательным данным."
          rows={[...buildDemographicRows(summary), ...buildGroupRows(summary)]}
          valueHeader="Попытки"
          emptyMessage="Нет демографических или групповых данных."
        />
      </div>

      <TestAnalyticsBreakdownTable
        title="Публичные ссылки"
        description="Вклад каждой ссылки в текущую выборку."
        rows={buildPublicLinkRows(summary)}
        valueHeader="Всего / завершено"
        emptyMessage="В выборке нет публичных ссылок."
      />

      <div className="flex items-center gap-2">
        <ListChecks className="size-4" />
        <p className={cn('text-sm', adminClassNames.text.muted)}>
          Детализация отдельных прохождений доступна в таблице выбранной ссылки ниже.
        </p>
      </div>

      <TestAnalyticsAttemptsTable summary={summary} formatDateTime={formatDateTime} />
    </div>
  );
}
