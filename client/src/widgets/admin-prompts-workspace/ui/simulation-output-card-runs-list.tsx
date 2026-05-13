import { adminClassNames } from '@/shared/ui/admin-design-tokens';

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
        <div className={adminClassNames.panel.emptyCenter}>Запусков пока нет.</div>
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
