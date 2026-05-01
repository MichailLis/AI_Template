import { AlertTriangle, CheckCircle2, Copy, Loader2, Play, Save } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import type { SimulationRun } from '../model/types';
import type { PromptTestQuestionsResponseDtoQuestionsItem } from '@/shared/api/model';

interface SimulationOutputCardProps {
  runs: SimulationRun[];
  testQuestions: PromptTestQuestionsResponseDtoQuestionsItem[];
  selectedQuestionIds: number[];
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
  onRunSimulation: () => void;
  onToggleQuestion: (questionId: number) => void;
  onSelectAllQuestions: () => void;
  onClearSelectedQuestions: () => void;
  onSavePromptVersion: () => void;
  onCopyRunJson: (run: SimulationRun) => Promise<void>;
}

export function SimulationOutputCard({
  runs,
  testQuestions,
  selectedQuestionIds,
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
  onRunSimulation,
  onToggleQuestion,
  onSelectAllQuestions,
  onClearSelectedQuestions,
  onSavePromptVersion,
  onCopyRunJson,
}: SimulationOutputCardProps) {
  const selectedQuestionsCount = selectedQuestionIds.length;

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
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Тестовые вопросы</p>
              <p className="text-xs text-slate-500">
                Выберите вопросы, по которым ИИ сгенерирует тестовые ответы и итоговый JSON.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onSelectAllQuestions}
                disabled={isLoadingQuestions || testQuestions.length === 0}
              >
                Все
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onClearSelectedQuestions}
                disabled={selectedQuestionsCount === 0}
              >
                Снять
              </Button>
            </div>
          </div>

          {isLoadingQuestions ? (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаем вопросы...
            </div>
          ) : null}

          {!isLoadingQuestions && testQuestions.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Вопросы еще не найдены.
            </div>
          ) : null}

          {!isLoadingQuestions && testQuestions.length > 0 ? (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
              {testQuestions.map((question) => {
                const isChecked = selectedQuestionIds.includes(question.id);

                return (
                  <label
                    key={question.id}
                    className="flex cursor-pointer items-start gap-3 rounded-md bg-white p-3 text-sm shadow-sm transition hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={isChecked}
                      onChange={() => onToggleQuestion(question.id)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-slate-900">{question.title}</span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {question.topicTitle} · версия {question.versionNumber} ·{' '}
                        {question.versionStatus} · {question.type}
                      </span>
                      {question.description ? (
                        <span className="mt-1 line-clamp-2 block text-xs text-slate-500">
                          {question.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                );
              })}
            </div>
          ) : null}
        </div>

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
            <span>{selectedQuestionsCount} questions selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onSavePromptVersion}
              disabled={isSavingPromptVersion}
            >
              {isSavingPromptVersion ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить версию
            </Button>
            <Button type="button" onClick={onRunSimulation} disabled={!canRun || isGenerating}>
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
