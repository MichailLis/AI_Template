import { SimulationRunItem } from './simulation-output-card-run-item';

import type { SimulationRun } from '../model/types';

interface SimulationRunsListProps {
  runs: SimulationRun[];
  showMetrics: boolean;
  diffView: boolean;
  onCopyRunJson: (run: SimulationRun) => Promise<void>;
}

export function SimulationRunsList({
  runs,
  showMetrics,
  diffView,
  onCopyRunJson,
}: SimulationRunsListProps) {
  return (
    <div className="max-h-[640px] flex-1 space-y-3 overflow-y-auto p-4">
      {runs.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Запусков пока нет.
        </div>
      ) : null}

      {runs.map((run, index) => (
        <SimulationRunItem
          key={run.id}
          run={run}
          showMetrics={showMetrics}
          diffView={diffView}
          onCopyRunJson={onCopyRunJson}
          totalRuns={runs.length}
          runIndex={index}
        />
      ))}
    </div>
  );
}
