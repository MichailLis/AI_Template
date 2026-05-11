import { AlertTriangle, CheckCircle2, Copy, Loader2 } from 'lucide-react';

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
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
        <span>
          INPUT #{String(totalRuns - runIndex).padStart(3, '0')} - {run.createdAt}
        </span>
        <span>{run.model}</span>
      </div>

      <div className="space-y-3 px-4 py-3">
        {run.status === 'running' ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Генерируем тестовые ответы и анализ...
          </div>
        ) : null}

        {run.status === 'error' ? (
          <div className="flex items-start gap-2 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            <span>{run.errorMessage ?? 'Unknown error'}</span>
          </div>
        ) : null}

        {run.status === 'success' ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Completed
            </div>
            {diffView ? (
              <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-xs text-slate-700">
                {run.output}
              </pre>
            ) : (
              <div className="whitespace-pre-wrap text-sm text-slate-700">{run.output}</div>
            )}
          </div>
        ) : null}
      </div>

      {showMetrics && run.status === 'success' ? (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2 text-xs text-slate-500">
          <div className="flex items-center gap-3">
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
