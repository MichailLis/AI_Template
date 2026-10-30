import { Sparkles } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
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

import { AI_QUESTION_TYPE_LABELS, AI_QUESTION_TYPES } from '../lib/ai-generator-utils';
import { useAiTestGeneration } from '../model/use-ai-test-generation';

import { AiModelCombobox } from './ai-model-combobox';
import { AiQuestionsPreview } from './ai-questions-preview';

import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

interface AiTestGeneratorModalProps {
  open: boolean;
  isCreating: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onCreate: (payload: CreateTestsTopicFromAiDto) => void;
}

type AiTestGenerationState = ReturnType<typeof useAiTestGeneration>;

interface AiGeneratorFormProps {
  generation: AiTestGenerationState;
}

interface AiGeneratorFooterProps {
  generation: AiTestGenerationState;
  isCreating: boolean;
  onClose: () => void;
  onCreate: () => void;
}

function AiGeneratorForm({ generation }: AiGeneratorFormProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-test-title">Тема теста</Label>
        <Input
          id="ai-test-title"
          value={generation.topicTitle}
          onChange={(event) => generation.setTopicTitle(event.target.value)}
          placeholder="Например: Профориентация для старшеклассников"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-test-description">Описание теста (сохранится в карточке теста)</Label>
        <Textarea
          id="ai-test-description"
          rows={3}
          value={generation.topicDescription}
          onChange={(event) => generation.setTopicDescription(event.target.value)}
          placeholder="Коротко опишите цель и аудиторию теста"
        />
      </div>

      <div className="flex flex-col gap-2">
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
        <div className="flex flex-col gap-2">
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

      <div className={`flex flex-col gap-2 ${adminClassNames.panel.mutedSection}`}>
        <Label>Типы вопросов</Label>
        <div className="flex flex-wrap gap-2">
          {AI_QUESTION_TYPES.map((type) => (
            <Button
              key={type}
              type="button"
              size="sm"
              variant={generation.selectedTypes[type] ? 'secondary' : 'outline'}
              className={
                generation.selectedTypes[type] ? adminToneClassNames.info.active : undefined
              }
              onClick={() => generation.handleTypeToggle(type)}
            >
              {AI_QUESTION_TYPE_LABELS[type]}
            </Button>
          ))}
        </div>
      </div>

      {generation.generationError ? (
        <p className={adminClassNames.panel.dangerInline}>{generation.generationError}</p>
      ) : null}
    </div>
  );
}

function AiGeneratorFooter({ generation, isCreating, onClose, onCreate }: AiGeneratorFooterProps) {
  return (
    <DialogFooter className="gap-2 sm:justify-between">
      <Button type="button" variant="outline" onClick={onClose}>
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
        onClick={onCreate}
        disabled={isCreating || generation.previewQuestions.length === 0}
      >
        {isCreating ? 'Создание теста...' : 'Создать тест'}
      </Button>
    </DialogFooter>
  );
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
      <DialogContent
        className={`max-h-[92vh] max-w-4xl overflow-y-auto ${adminClassNames.dialog.content}`}
      >
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
              >
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Создать тест с ИИ</DialogTitle>
                <DialogDescription>
                  Укажите тему и задачу. ИИ сгенерирует список вопросов, который можно сразу
                  сохранить как новый тест.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={adminBadgeClassNames.notice}>
              Черновик перед сохранением
            </Badge>
          </div>
        </DialogHeader>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_minmax(0,1fr)]">
          <AiGeneratorForm generation={generation} />
          <AiQuestionsPreview questions={generation.previewQuestions} />
        </div>

        <AiGeneratorFooter
          generation={generation}
          isCreating={isCreating}
          onClose={() => onOpenChange(false)}
          onCreate={handleCreate}
        />
      </DialogContent>
    </Dialog>
  );
}
