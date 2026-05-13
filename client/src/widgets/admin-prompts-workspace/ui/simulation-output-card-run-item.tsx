import { AlertTriangle, CheckCircle2, Copy, Loader2 } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import type { SimulationRun } from '../model/types';

interface SimulationRunItemProps {
  run: SimulationRun;
  showMetrics: boolean;
  diffView: boolean;
  onCopyRunJson: (run: SimulationRun) => Promise<void>;
  totalRuns: number;
  runIndex: number;
}

export function SimulationRunItem({
  run,
  showMetrics,
  diffView,
  onCopyRunJson,
  totalRuns,
  runIndex,
}: SimulationRunItemProps) {
  return (
    <div className={adminClassNames.panel.frame}>
      <div
        className={`flex flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${adminClassNames.border.bottom} ${adminClassNames.text.muted}`}
      >
        <span className="font-mono">
          INPUT #{String(totalRuns - runIndex).padStart(3, '0')} - {run.createdAt}
        </span>
        <span className="min-w-0 truncate">{run.model}</span>
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        {run.status === 'running' ? (
          <div className={`flex items-center gap-2 text-sm ${adminClassNames.text.body}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            Генерируем тестовые ответы и анализ...
          </div>
        ) : null}

        {run.status === 'error' ? (
          <div className={`flex items-start gap-2 text-sm ${adminToneClassNames.danger.text}`}>
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{run.errorMessage ?? 'Unknown error'}</span>
          </div>
        ) : null}

        {run.status === 'success' ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <Badge variant="outline" className={adminBadgeClassNames.success}>
                Completed
              </Badge>
            </div>
            {diffView ? (
              <pre className={adminClassNames.code.softBlock}>{run.output}</pre>
            ) : (
              <div className={`whitespace-pre-wrap text-sm ${adminClassNames.text.body}`}>
                {run.output}
              </div>
            )}
          </div>
        ) : null}
      </div>

      {showMetrics && run.status === 'success' ? (
        <div
          className={`flex flex-col gap-2 px-4 py-2 text-xs sm:flex-row sm:items-center sm:justify-between ${adminClassNames.panel.mutedBar} ${adminClassNames.border.top} ${adminClassNames.text.muted}`}
        >
          <div className="flex flex-wrap items-center gap-3">
            <span>Latency: {run.latencyMs ?? '-'}ms</span>
            <span>Tokens: {run.totalTokens ?? '-'}</span>
          </div>
          <Button type="button" size="sm" variant="ghost" onClick={() => void onCopyRunJson(run)}>
            <Copy className="mr-2 h-4 w-4" />
            Copy JSON
          </Button>
        </div>
      ) : null}
    </div>
  );
}
