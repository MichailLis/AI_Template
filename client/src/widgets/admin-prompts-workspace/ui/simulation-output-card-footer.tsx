import { Loader2, Play, Save } from 'lucide-react';

import { pluralizeRu } from '@/shared/lib/ru-plural';
import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

interface PromptSaveRunFooterProps {
  promptTitle: string;
  selectedPromptId: number | null;
  selectedPromptVersionNumber: number | null;
  isSavingPromptVersion: boolean;
  detectedVariablesCount: number;
  selectedQuestionIds: number[];
  isGenerating: boolean;
  canRun: boolean;
  onPromptTitleChange: (value: string) => void;
  onRunSimulation: () => void;
  onSavePromptVersion: () => void;
}

export function PromptSaveRunFooter({
  promptTitle,
  selectedPromptId,
  selectedPromptVersionNumber,
  isSavingPromptVersion,
  detectedVariablesCount,
  selectedQuestionIds,
  isGenerating,
  canRun,
  onPromptTitleChange,
  onRunSimulation,
  onSavePromptVersion,
}: PromptSaveRunFooterProps) {
  const selectedQuestionsCount = selectedQuestionIds.length;

  return (
    <div className={`flex flex-col gap-4 p-4 ${adminClassNames.border.top}`}>
      <div
        className={`grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end ${adminClassNames.panel.compactSection}`}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="prompt-title">Название промпта</Label>
          <Input
            id="prompt-title"
            value={promptTitle}
            onChange={(event) => onPromptTitleChange(event.target.value)}
            placeholder="Например: Карьерный анализ по итогам теста"
          />
          <div
            className={`flex flex-wrap items-center gap-2 text-xs ${adminClassNames.text.muted}`}
          >
            {selectedPromptId ? (
              <>
                <Badge variant="outline" className={adminBadgeClassNames.info}>
                  Редактируется #{selectedPromptId}
                </Badge>
                {selectedPromptVersionNumber ? (
                  <span>Текущая версия v{selectedPromptVersionNumber}</span>
                ) : null}
              </>
            ) : (
              <Badge variant="outline" className={adminBadgeClassNames.notice}>
                Новый промпт
              </Badge>
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
        <div
          className={`flex min-w-0 flex-wrap items-center gap-2 text-xs ${adminClassNames.text.muted}`}
        >
          <Badge variant="outline" className={adminBadgeClassNames.neutral}>
            {detectedVariablesCount} переменные
          </Badge>
          <span>{`${selectedQuestionsCount} ${pluralizeRu(selectedQuestionsCount, ['вопрос', 'вопроса', 'вопросов'])} выбранного теста`}</span>
        </div>
        {/* На 320 px подпись длиннее экрана: кнопка переносит текст, а не расширяет страницу. */}
        <Button
          type="button"
          className="h-auto max-w-full whitespace-normal py-2 text-left"
          onClick={onRunSimulation}
          disabled={!canRun || isGenerating}
        >
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
  );
}
