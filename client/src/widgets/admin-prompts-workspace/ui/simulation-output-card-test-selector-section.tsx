import { Loader2 } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';

import type { PromptTestQuestionsResponseDtoTestsItem } from '@/shared/api/model';

interface PromptTestSelectorSectionProps {
  testQuestionGroups: PromptTestQuestionsResponseDtoTestsItem[];
  selectedTest: PromptTestQuestionsResponseDtoTestsItem | null;
  selectedTestId: number | null;
  selectedQuestionIds: number[];
  isLoadingQuestions: boolean;
  onSelectedTestChange: (testId: number | null) => void;
}

export function PromptTestSelectorSection({
  testQuestionGroups,
  selectedTest,
  selectedTestId,
  selectedQuestionIds,
  isLoadingQuestions,
  onSelectedTestChange,
}: PromptTestSelectorSectionProps) {
  const selectedQuestionsCount = selectedQuestionIds.length;

  return (
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
  );
}
