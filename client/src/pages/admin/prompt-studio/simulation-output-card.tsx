import { AlertTriangle, CheckCircle2, Copy, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import type { SimulationRun } from './types';

interface SimulationOutputCardProps {
  runs: SimulationRun[];
  showMetrics: boolean;
  onShowMetricsChange: (value: boolean) => void;
  diffView: boolean;
  onDiffViewChange: (value: boolean) => void;
  onClearLogs: () => void;
  detectedVariablesCount: number;
  isGenerating: boolean;
  canRun: boolean;
  onRunSimulation: () => void;
  onCopyRunJson: (run: SimulationRun) => Promise<void>;
}

export function SimulationOutputCard({
  runs,
  showMetrics,
  onShowMetricsChange,
  diffView,
  onDiffViewChange,
  onClearLogs,
  detectedVariablesCount,
  isGenerating,
  canRun,
  onRunSimulation,
  onCopyRunJson,
}: SimulationOutputCardProps) {
  return (
    <Card className="min-w-0 border-slate-200 shadow-sm">
      <CardHeader className="border-b border-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Simulation Output</CardTitle>
            <CardDescription>
              Simulated run history for first approximation of UX flow.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showMetrics}
                onChange={(event) => onShowMetricsChange(event.target.checked)}
              />
              Show metrics
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={diffView}
                onChange={(event) => onDiffViewChange(event.target.checked)}
              />
              Diff view
            </label>
            <Button type="button" size="sm" variant="ghost" onClick={onClearLogs}>
              Clear logs
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col p-0">
        <div className="max-h-[640px] flex-1 space-y-3 overflow-y-auto p-4">
          {runs.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No simulation logs yet. Run simulation to see output blocks.
            </div>
          ) : null}

          {runs.map((run, index) => (
            <div key={run.id} className="rounded-md border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2 text-xs text-slate-500">
                <span>
                  INPUT #{String(runs.length - index).padStart(3, '0')} - {run.createdAt}
                </span>
                <span>{run.model}</span>
              </div>

              <div className="space-y-3 px-4 py-3">
                {run.status === 'running' ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Running simulation...
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
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void onCopyRunJson(run)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy JSON
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Badge variant="outline">{detectedVariablesCount} variables detected</Badge>
            <span>Ready to run</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => toast.info('Draft persistence is planned in the next iteration')}
            >
              Save Draft
            </Button>
            <Button type="button" onClick={onRunSimulation} disabled={!canRun}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
