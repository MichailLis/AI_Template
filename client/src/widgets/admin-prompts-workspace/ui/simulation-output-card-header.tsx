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
    <CardHeader className="border-b border-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <CardTitle>Проверка промпта</CardTitle>
          <CardDescription>
            Сгенерируйте тестовые ответы ИИ и сохраните готовый промпт для анализа.
          </CardDescription>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showMetrics}
              onChange={(event) => onShowMetricsChange(event.target.checked)}
            />
            Метрики
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={diffView}
              onChange={(event) => onDiffViewChange(event.target.checked)}
            />
            JSON-view
          </label>
          <Button type="button" size="sm" variant="ghost" onClick={onClearLogs}>
            Очистить
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
