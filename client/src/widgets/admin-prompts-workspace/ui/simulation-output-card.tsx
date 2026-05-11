import { Card, CardContent } from '@/shared/ui/card';

import { PromptSaveRunFooter } from './simulation-output-card-footer';
import { SimulationOutputCardHeader } from './simulation-output-card-header';
import { SimulationRunsList } from './simulation-output-card-runs-list';
import { PromptTestSelectorSection } from './simulation-output-card-test-selector-section';

import type { SimulationRun } from '../model/types';
import type { PromptTestQuestionsResponseDtoTestsItem } from '@/shared/api/model';

interface SimulationOutputCardProps {
  runs: SimulationRun[];
  testQuestionGroups: PromptTestQuestionsResponseDtoTestsItem[];
  selectedTest: PromptTestQuestionsResponseDtoTestsItem | null;
  selectedTestId: number | null;
  selectedQuestionIds: number[];
  promptTitle: string;
  selectedPromptId: number | null;
  selectedPromptVersionNumber: number | null;
  isLoadingQuestions: boolean;
  isSavingPromptVersion: boolean;
  showMetrics: boolean;
  onShowMetricsChange: (value: boolean) => void;
  diffView: boolean;
  onDiffViewChange: (value: boolean) => void;
  onClearLogs: () => void;
  detectedVariablesCount: number;
  isGenerating: boolean;
  canRun: boolean;
  onPromptTitleChange: (value: string) => void;
  onSelectedTestChange: (testId: number | null) => void;
  onRunSimulation: () => void;
  onSavePromptVersion: () => void;
  onCopyRunJson: (run: SimulationRun) => Promise<void>;
}

export function SimulationOutputCard({
  runs,
  testQuestionGroups,
  selectedTest,
  selectedTestId,
  selectedQuestionIds,
  promptTitle,
  selectedPromptId,
  selectedPromptVersionNumber,
  isLoadingQuestions,
  isSavingPromptVersion,
  showMetrics,
  onShowMetricsChange,
  diffView,
  onDiffViewChange,
  onClearLogs,
  detectedVariablesCount,
  isGenerating,
  canRun,
  onPromptTitleChange,
  onSelectedTestChange,
  onRunSimulation,
  onSavePromptVersion,
  onCopyRunJson,
}: SimulationOutputCardProps) {
  return (
    <Card className="min-w-0 border-slate-200 shadow-sm">
      <SimulationOutputCardHeader
        showMetrics={showMetrics}
        onShowMetricsChange={onShowMetricsChange}
        diffView={diffView}
        onDiffViewChange={onDiffViewChange}
        onClearLogs={onClearLogs}
      />
      <CardContent className="flex flex-col p-0">
        <PromptTestSelectorSection
          testQuestionGroups={testQuestionGroups}
          selectedTest={selectedTest}
          selectedTestId={selectedTestId}
          selectedQuestionIds={selectedQuestionIds}
          isLoadingQuestions={isLoadingQuestions}
          onSelectedTestChange={onSelectedTestChange}
        />
        <SimulationRunsList
          runs={runs}
          showMetrics={showMetrics}
          diffView={diffView}
          onCopyRunJson={onCopyRunJson}
        />
        <PromptSaveRunFooter
          promptTitle={promptTitle}
          selectedPromptId={selectedPromptId}
          selectedPromptVersionNumber={selectedPromptVersionNumber}
          isSavingPromptVersion={isSavingPromptVersion}
          detectedVariablesCount={detectedVariablesCount}
          isGenerating={isGenerating}
          selectedQuestionIds={selectedQuestionIds}
          canRun={canRun}
          onPromptTitleChange={onPromptTitleChange}
          onRunSimulation={onRunSimulation}
          onSavePromptVersion={onSavePromptVersion}
        />
      </CardContent>
    </Card>
  );
}
