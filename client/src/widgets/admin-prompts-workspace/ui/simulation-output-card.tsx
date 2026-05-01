import { AlertTriangle, CheckCircle2, Copy, Loader2, Play, Save } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

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
  const selectedQuestionsCount = selectedQuestionIds.length;

  return (
    <Card className="min-w-0 border-slate-200 shadow-sm">
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

      <CardContent className="flex flex-col p-0">
        <div className="space-y-3 border-b border-slate-200 p-4">
          <div className="space-y-2">
            <Label htmlFor="prompt-test-group">Тест для проверки промпта</Label>
            <select
              id="prompt-test-group"
              value={selectedTestId ?? ''}
              onChange={(event) => {
                const nextValue = Number(event.target.value);
                onSelectedTestChange(Number.isFinite(nextValue) ? nextValue : null);
              }}
              disabled={isLoadingQuestions || testQuestionGroups.length === 0}
              className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
            >
              {testQuestionGroups.length === 0 ? (
                <option value="">Нет тестов с вопросами</option>
              ) : null}
              {testQuestionGroups.map((testGroup) => (
                <option key={testGroup.id} value={testGroup.id}>
                  {testGroup.title} · версия {testGroup.versionNumber} · {testGroup.versionStatus} ·{' '}
                  {testGroup.questionCount} вопросов
                </option>
              ))}
            </select>
          </div>

          {isLoadingQuestions ? (
            <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Загружаем тесты...
            </div>
          ) : null}

          {!isLoadingQuestions && testQuestionGroups.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              Тесты с вопросами еще не найдены.
            </div>
          ) : null}

          {!isLoadingQuestions && selectedTest ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <Badge variant="outline">{selectedQuestionsCount} вопросов в проверке</Badge>
                <span>
                  {selectedTest.topicSlug} · версия {selectedTest.versionNumber} ·{' '}
                  {selectedTest.versionStatus}
                </span>
              </div>

              <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-2">
                {selectedTest.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-start gap-3 rounded-md bg-white p-3 text-sm shadow-sm"
                  >
                    <Badge variant="outline" className="mt-0.5 shrink-0">
                      {index + 1}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-slate-900">{question.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{question.type}</div>
                      {question.description ? (
                        <div className="mt-1 line-clamp-2 text-xs text-slate-500">
                          {question.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="max-h-[640px] flex-1 space-y-3 overflow-y-auto p-4">
          {runs.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              Запусков пока нет.
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

        <div className="space-y-4 border-t border-slate-200 p-4">
          <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="space-y-2">
              <Label htmlFor="prompt-title">Название промпта</Label>
              <Input
                id="prompt-title"
                value={promptTitle}
                onChange={(event) => onPromptTitleChange(event.target.value)}
                placeholder="Например: Карьерный анализ по итогам теста"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {selectedPromptId ? (
                  <>
                    <Badge variant="outline">Редактируется #{selectedPromptId}</Badge>
                    {selectedPromptVersionNumber ? (
                      <span>Текущая версия v{selectedPromptVersionNumber}</span>
                    ) : null}
                  </>
                ) : (
                  <Badge variant="outline">Новый промпт</Badge>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={onSavePromptVersion}
              disabled={isSavingPromptVersion || promptTitle.trim().length === 0}
              className="md:min-w-48"
            >
              {isSavingPromptVersion ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {selectedPromptId ? 'Сохранить новую версию' : 'Сохранить промпт'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Badge variant="outline">{detectedVariablesCount} переменные</Badge>
              <span>{selectedQuestionsCount} вопросов выбранного теста</span>
            </div>
            <Button type="button" onClick={onRunSimulation} disabled={!canRun || isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Генерируем...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Сгенерировать тестовые ответы ИИ
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
