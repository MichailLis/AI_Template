import { RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useAdminAiUsageControllerGetSummary } from '@/shared/api/generated/admin/admin';
import { formatDateTime } from '@/shared/lib/date-format';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { getAdminTabPanelProps } from '@/shared/ui/admin-tabs.model';
import { Button } from '@/shared/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

import {
  AI_USAGE_PERIODS,
  aiUsagePurposeLabels,
  formatAiUsageCost,
  formatAiUsageCount,
  getAiUsagePeriodStart,
} from './admin-settings-ai-usage.model';
import { SettingsLoadError } from './admin-settings-cards.parts';

import type { AiUsageBucket, AiUsagePeriod } from './admin-settings-ai-usage.model';

const PANEL_ID = 'ai-usage-panel';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={adminClassNames.panel.compactCard}>
      <p className={adminClassNames.text.kicker}>{label}</p>
      <p className={`mt-1 text-lg font-semibold ${adminClassNames.text.heading}`}>{value}</p>
      {hint ? <p className={`mt-0.5 text-xs ${adminClassNames.text.muted}`}>{hint}</p> : null}
    </div>
  );
}

function BreakdownTable({
  caption,
  firstColumn,
  rows,
}: {
  caption: string;
  firstColumn: string;
  rows: Array<{ key: string; label: string; bucket: AiUsageBucket }>;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <Table aria-label={caption} className="min-w-[30rem]">
        <TableHeader>
          <TableRow>
            <TableHead>{firstColumn}</TableHead>
            <TableHead className="text-right">Вызовов</TableHead>
            <TableHead className="text-right">Токены</TableHead>
            <TableHead className="text-right">Стоимость</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ key, label, bucket }) => (
            <TableRow key={key}>
              <TableCell className="break-words">{label}</TableCell>
              <TableCell className="text-right">
                {formatAiUsageCount(bucket.calls)}
                {bucket.failedCalls > 0 ? ` (неудачных: ${bucket.failedCalls})` : ''}
              </TableCell>
              <TableCell className="text-right">{formatAiUsageCount(bucket.totalTokens)}</TableCell>
              <TableCell className="text-right">{formatAiUsageCost(bucket.cost)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Расходы на ИИ за сегодня, 7 и 30 дней. Границы периода считает браузер по своему часовому поясу
 * и присылает моментом: сервер поясов не знает. Токены и стоимость берутся из ответов провайдера,
 * поэтому у провайдера, который стоимость не присылает, сумма занижена: об этом сказано под ней.
 */
export function AiUsageSummary() {
  const [period, setPeriod] = useState<AiUsagePeriod>('today');
  const from = useMemo(() => {
    const days = AI_USAGE_PERIODS.find((entry) => entry.value === period)?.days ?? 1;

    return getAiUsagePeriodStart(days).toISOString();
  }, [period]);
  const { data, isLoading, isError, isFetching, refetch } = useAdminAiUsageControllerGetSummary({
    from,
  });

  return (
    <div className={`flex flex-col gap-3 ${adminClassNames.panel.compactSection}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>Расходы на ИИ</p>
          <p className={`mt-1 text-sm ${adminClassNames.text.muted}`}>
            Токены и стоимость каждого вызова провайдера: анализ попыток, генерация, симуляция и
            проверка связи. Тексты запросов и ответов не сохраняются.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminTabs
            ariaLabel="Период расходов на ИИ"
            tabs={AI_USAGE_PERIODS.map(({ value, label }) => ({ value, label }))}
            activeTab={period}
            onTabChange={setPeriod}
            panelId={PANEL_ID}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            aria-label="Обновить расходы"
            onClick={() => void refetch()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div {...getAdminTabPanelProps(PANEL_ID, period)} className="flex flex-col gap-3">
        {isLoading ? <div className={adminClassNames.panel.loading}>Считаем расходы...</div> : null}
        {isError ? (
          <SettingsLoadError
            message="Не удалось загрузить расходы на ИИ."
            onRetry={() => void refetch()}
          />
        ) : null}

        {data ? (
          <>
            <p className={`text-xs ${adminClassNames.text.muted}`}>
              С {formatDateTime(data.from)} по {formatDateTime(data.to)}, по времени вашего
              браузера.
            </p>
            {data.totals.calls === 0 ? (
              <div className={adminClassNames.panel.empty}>За этот период вызовов ИИ не было.</div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Stat
                    label="Вызовов"
                    value={formatAiUsageCount(data.totals.calls)}
                    hint={
                      data.totals.failedCalls > 0
                        ? `неудачных: ${formatAiUsageCount(data.totals.failedCalls)}`
                        : undefined
                    }
                  />
                  <Stat
                    label="Токены"
                    value={formatAiUsageCount(data.totals.totalTokens)}
                    hint={`запрос ${formatAiUsageCount(data.totals.promptTokens)} · ответ ${formatAiUsageCount(data.totals.completionTokens)}`}
                  />
                  <Stat
                    label="Стоимость"
                    value={formatAiUsageCost(data.totals.cost)}
                    hint="в единицах счёта провайдера"
                  />
                </div>
                {data.totals.callsWithoutCost > 0 ? (
                  <div
                    role="status"
                    className={`rounded-md border px-3 py-2 text-sm ${adminToneClassNames.warning.active}`}
                  >
                    У {formatAiUsageCount(data.totals.callsWithoutCost)} успешных вызовов провайдер
                    не прислал стоимость: сумма занижена.
                  </div>
                ) : null}
                <BreakdownTable
                  caption="Расходы по виду вызова"
                  firstColumn="Вид вызова"
                  rows={data.byPurpose.map((entry) => ({
                    key: entry.purpose,
                    label: aiUsagePurposeLabels[entry.purpose],
                    bucket: entry,
                  }))}
                />
                <BreakdownTable
                  caption="Расходы по модели"
                  firstColumn="Модель"
                  rows={data.byModel.map((entry) => ({
                    key: entry.model,
                    label: entry.model,
                    bucket: entry,
                  }))}
                />
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
