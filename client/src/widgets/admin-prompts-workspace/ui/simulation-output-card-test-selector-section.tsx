import { Loader2 } from 'lucide-react';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
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
    <div className={`flex flex-col gap-3 p-4 ${adminClassNames.border.bottom}`}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="prompt-test-group">Тест для проверки промпта</Label>
        <select
          id="prompt-test-group"
          value={selectedTestId ?? ''}
          onChange={(event) => {
            const nextValue = Number(event.target.value);
            onSelectedTestChange(Number.isFinite(nextValue) ? nextValue : null);
          }}
          disabled={isLoadingQuestions || testQuestionGroups.length === 0}
          className={adminClassNames.form.select}
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
        <div className={`flex items-center gap-2 p-3 text-sm ${adminClassNames.panel.loading}`}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Загружаем тесты...
        </div>
      ) : null}

      {!isLoadingQuestions && testQuestionGroups.length === 0 ? (
        <div className={adminClassNames.panel.empty}>Тесты с вопросами еще не найдены.</div>
      ) : null}

      {!isLoadingQuestions && selectedTest ? (
        <div className="flex flex-col gap-2">
          <div
            className={`flex flex-wrap items-center gap-2 text-xs ${adminClassNames.text.muted}`}
          >
            <Badge variant="outline" className={adminBadgeClassNames.info}>
              {selectedQuestionsCount} вопросов в проверке
            </Badge>
            <span>
              {selectedTest.topicSlug} · версия {selectedTest.versionNumber} ·{' '}
              {selectedTest.versionStatus}
            </span>
          </div>

          <div
            className={`flex max-h-56 flex-col gap-2 overflow-y-auto p-2 ${adminClassNames.panel.frame}`}
          >
            {selectedTest.questions.map((question, index) => (
              <div key={question.id} className={adminClassNames.panel.inlineItem}>
                <Badge
                  variant="outline"
                  className={`mt-0.5 shrink-0 ${adminBadgeClassNames.neutral}`}
                >
                  {index + 1}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className={`font-medium ${adminClassNames.text.heading}`}>
                    {question.title}
                  </div>
                  <div className={`mt-1 text-xs ${adminClassNames.text.muted}`}>
                    {question.type}
                  </div>
                  {question.description ? (
                    <div className={`mt-1 line-clamp-2 text-xs ${adminClassNames.text.muted}`}>
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
