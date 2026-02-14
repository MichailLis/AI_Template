import { Sparkles } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

import { AI_QUESTION_TYPE_LABELS, AI_QUESTION_TYPES } from './ai-generator-utils';
import { AiModelCombobox } from './ai-model-combobox';
import { AiQuestionsPreview } from './ai-questions-preview';
import { useAiTestGeneration } from './use-ai-test-generation';

import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

interface AiTestGeneratorModalProps {
  open: boolean;
  isCreating: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onCreate: (payload: CreateTestsTopicFromAiDto) => void;
}

export function AiTestGeneratorModal({
  open,
  isCreating,
  onOpenChange,
  onCreate,
}: AiTestGeneratorModalProps) {
  const generation = useAiTestGeneration({ open });

  const handleCreate = () => {
    const payload = generation.buildCreatePayload();
    if (!payload) {
      return;
    }

    onCreate(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-slate-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Создать тест с ИИ
          </DialogTitle>
          <DialogDescription>
            Укажите тему и задачу. ИИ сгенерирует список вопросов, который можно сразу сохранить как
            новый тест.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ai-test-title">Тема теста</Label>
              <Input
                id="ai-test-title"
                value={generation.topicTitle}
                onChange={(event) => generation.setTopicTitle(event.target.value)}
                placeholder="Например: Профориентация для старшеклассников"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-test-description">
                Описание теста (сохранится в карточке теста)
              </Label>
              <Textarea
                id="ai-test-description"
                rows={3}
                value={generation.topicDescription}
                onChange={(event) => generation.setTopicDescription(event.target.value)}
                placeholder="Коротко опишите цель и аудиторию теста"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-generation-task">Что нужно сгенерировать</Label>
              <Textarea
                id="ai-generation-task"
                rows={4}
                value={generation.generationTask}
                onChange={(event) => generation.setGenerationTask(event.target.value)}
                placeholder="Например: тест на 8 вопросов, оценка склонностей к инженерным и гуманитарным направлениям"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ai-question-count">Количество вопросов</Label>
                <Input
                  id="ai-question-count"
                  type="number"
                  min={1}
                  max={60}
                  value={generation.questionCount}
                  onChange={(event) => generation.setQuestionCount(event.target.value)}
                />
              </div>

              <AiModelCombobox
                allModelsCount={generation.allModelOptions.length}
                modelOptionsCount={generation.modelOptions.length}
                visibleModelOptions={generation.visibleModelOptions}
                selectedModelItem={generation.selectedModelItem}
                selectedModelId={generation.effectiveModel}
                modelFilter={generation.modelFilter}
                isLoading={generation.modelsQuery.isLoading}
                isError={generation.modelsQuery.isError}
                onSelectModel={generation.setSelectedModel}
                onModelFilterChange={generation.setModelFilter}
                onRetryModels={() => {
                  void generation.modelsQuery.refetch();
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Типы вопросов</Label>
              <div className="flex flex-wrap gap-2">
                {AI_QUESTION_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={generation.selectedTypes[type] ? 'secondary' : 'outline'}
                    onClick={() => generation.handleTypeToggle(type)}
                  >
                    {AI_QUESTION_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </div>

            {generation.generationError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {generation.generationError}
              </p>
            ) : null}
          </div>

          <AiQuestionsPreview questions={generation.previewQuestions} />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={generation.handleGenerate}
            disabled={generation.generateMutation.isPending}
          >
            {generation.generateMutation.isPending ? 'Генерация...' : 'Сгенерировать вопросы'}
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || generation.previewQuestions.length === 0}
          >
            {isCreating ? 'Создание теста...' : 'Создать тест'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
