import { RotateCcw, SlidersHorizontal } from 'lucide-react';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface SimulationOutputCardHeaderProps {
  showMetrics: boolean;
  onShowMetricsChange: (value: boolean) => void;
  diffView: boolean;
  onDiffViewChange: (value: boolean) => void;
  onClearLogs: () => void;
}

export function SimulationOutputCardHeader({
  showMetrics,
  onShowMetricsChange,
  diffView,
  onDiffViewChange,
  onClearLogs,
}: SimulationOutputCardHeaderProps) {
  return (
    <CardHeader className={adminClassNames.border.bottom}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
          >
            <SlidersHorizontal className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Проверка промпта</CardTitle>
            <CardDescription>
              Сгенерируйте тестовые ответы ИИ и сохраните готовый промпт для анализа.
            </CardDescription>
          </div>
        </div>
        <div
          className={`flex flex-wrap items-center gap-3 text-xs ${adminClassNames.panel.mutedSection}`}
        >
          <label className={adminClassNames.form.checkboxLabel}>
            <input
              type="checkbox"
              checked={showMetrics}
              onChange={(event) => onShowMetricsChange(event.target.checked)}
            />
            Метрики
          </label>
          <label className={adminClassNames.form.checkboxLabel}>
            <input
              type="checkbox"
              checked={diffView}
              onChange={(event) => onDiffViewChange(event.target.checked)}
            />
            JSON-view
          </label>
          <Button type="button" size="sm" variant="ghost" onClick={onClearLogs}>
            <RotateCcw className="mr-2 size-4" />
            Очистить
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
