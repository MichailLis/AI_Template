import { Loader2, Play, Save } from 'lucide-react';

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
  );
}
