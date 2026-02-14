import { Check, ChevronsUpDown, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerGeneratePrompt,
  useAdminControllerGetPromptModels,
} from '@/shared/api/generated/admin/admin';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/ui/command';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { Textarea } from '@/shared/ui/textarea';

import {
  AI_QUESTION_TYPE_LABELS,
  AI_QUESTION_TYPES,
  buildAiQuestionJsonSchema,
  buildAiQuestionGenerationPrompt,
  parseAiQuestionsOutput,
} from './ai-generator-utils';
import { parseApiError } from './utils';

import type {
  CreateTestsTopicFromAiDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

interface AiTestGeneratorModalProps {
  open: boolean;
  isCreating: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onCreate: (payload: CreateTestsTopicFromAiDto) => void;
}

type ModelFilter = 'free' | 'all';

const DEFAULT_SELECTED_TYPES: Record<CreateTestsTopicFromAiDtoQuestionsItemType, boolean> = {
  OPEN_TEXT: true,
  SINGLE_CHOICE: true,
  MULTI_CHOICE: true,
  SLIDER: false,
};

export function AiTestGeneratorModal({
  open,
  isCreating,
  onOpenChange,
  onCreate,
}: AiTestGeneratorModalProps) {
  const modelsQuery = useAdminControllerGetPromptModels({
    query: {
      enabled: open,
      staleTime: 5 * 60 * 1000,
    },
  });
  const generateMutation = useAdminControllerGeneratePrompt();

  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [generationTask, setGenerationTask] = useState('');
  const [questionCount, setQuestionCount] = useState('8');
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelPopoverOpen, setIsModelPopoverOpen] = useState(false);
  const [modelPopoverContainer, setModelPopoverContainer] = useState<HTMLDivElement | null>(null);
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_SELECTED_TYPES);
  const [previewQuestions, setPreviewQuestions] = useState<
    CreateTestsTopicFromAiDtoQuestionsItem[]
  >([]);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const allModelOptions = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);

  const modelOptions = useMemo(
    () => allModelOptions.filter((model) => model.supportsStructuredOutputs),
    [allModelOptions],
  );

  const freeModelOptions = useMemo(
    () => modelOptions.filter((model) => model.isFree),
    [modelOptions],
  );

  const visibleModelOptions = useMemo(() => {
    if (modelFilter === 'free' && freeModelOptions.length > 0) {
      return freeModelOptions;
    }

    return modelOptions;
  }, [freeModelOptions, modelFilter, modelOptions]);

  const effectiveModel =
    (selectedModel && visibleModelOptions.some((model) => model.id === selectedModel)
      ? selectedModel
      : '') ||
    visibleModelOptions.find((model) => model.isFree)?.id ||
    (modelsQuery.data?.defaultModel &&
    modelOptions.some((model) => model.id === modelsQuery.data.defaultModel)
      ? modelsQuery.data.defaultModel
      : '') ||
    visibleModelOptions[0]?.id ||
    '';

  const selectedModelItem = useMemo(
    () => modelOptions.find((model) => model.id === effectiveModel) ?? null,
    [effectiveModel, modelOptions],
  );

  const allowedTypes = useMemo(
    () =>
      AI_QUESTION_TYPES.filter(
        (type) => selectedTypes[type],
      ) as CreateTestsTopicFromAiDtoQuestionsItemType[],
    [selectedTypes],
  );

  const handleTypeToggle = (type: CreateTestsTopicFromAiDtoQuestionsItemType) => {
    setSelectedTypes((previous) => ({
      ...previous,
      [type]: !previous[type],
    }));
  };

  const handleGenerate = () => {
    if (!topicTitle.trim()) {
      setGenerationError('Укажите тему теста');
      return;
    }

    if (!generationTask.trim()) {
      setGenerationError('Опишите, что именно должен генерировать ИИ');
      return;
    }

    if (!effectiveModel) {
      setGenerationError('Не удалось выбрать модель ИИ');
      return;
    }

    if (allowedTypes.length === 0) {
      setGenerationError('Выберите хотя бы один тип вопроса');
      return;
    }

    const parsedQuestionCount = Number.parseInt(questionCount, 10);
    if (Number.isNaN(parsedQuestionCount) || parsedQuestionCount < 1 || parsedQuestionCount > 60) {
      setGenerationError('Количество вопросов должно быть от 1 до 60');
      return;
    }

    setGenerationError(null);

    const prompt = buildAiQuestionGenerationPrompt({
      topicTitle: topicTitle.trim(),
      topicDescription: topicDescription.trim(),
      generationTask: generationTask.trim(),
      questionCount: parsedQuestionCount,
      allowedTypes,
    });
    const responseSchema = buildAiQuestionJsonSchema({
      questionCount: parsedQuestionCount,
      allowedTypes,
    });

    generateMutation.mutate(
      {
        data: {
          model: effectiveModel,
          prompt,
          temperature: 0.2,
          responseFormat: 'json',
          responseSchema: {
            name: 'generated_test_questions',
            strict: true,
            schema: responseSchema,
          },
          requireParameters: true,
          useResponseHealing: true,
        },
      },
      {
        onSuccess: (result) => {
          try {
            const questions = parseAiQuestionsOutput({
              rawOutput: result.output,
              expectedQuestionCount: parsedQuestionCount,
              allowedTypes,
            });

            setPreviewQuestions(questions);
            setGenerationError(null);
            toast.success('Вопросы сгенерированы. Проверьте результат перед созданием теста.');
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Не удалось разобрать ответ ИИ';
            setPreviewQuestions([]);
            setGenerationError(message);
          }
        },
        onError: (error) => {
          const message = parseApiError(error);
          setPreviewQuestions([]);
          setGenerationError(message);
          toast.error(message);
        },
      },
    );
  };

  const handleCreate = () => {
    if (!topicTitle.trim()) {
      setGenerationError('Укажите тему теста');
      return;
    }

    if (previewQuestions.length === 0) {
      setGenerationError('Сначала сгенерируйте вопросы');
      return;
    }

    onCreate({
      title: topicTitle.trim(),
      description: topicDescription.trim() || null,
      questions: previewQuestions,
    });
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
                value={topicTitle}
                onChange={(event) => setTopicTitle(event.target.value)}
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
                value={topicDescription}
                onChange={(event) => setTopicDescription(event.target.value)}
                placeholder="Коротко опишите цель и аудиторию теста"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-generation-task">Что нужно сгенерировать</Label>
              <Textarea
                id="ai-generation-task"
                rows={4}
                value={generationTask}
                onChange={(event) => setGenerationTask(event.target.value)}
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
                  value={questionCount}
                  onChange={(event) => setQuestionCount(event.target.value)}
                />
              </div>

              <div className="space-y-2" ref={setModelPopoverContainer}>
                <Label htmlFor="ai-model-selector">Модель ИИ</Label>
                <Popover open={isModelPopoverOpen} onOpenChange={setIsModelPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="ai-model-selector"
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={isModelPopoverOpen}
                      className="h-9 w-full justify-between"
                      disabled={modelsQuery.isLoading || modelOptions.length === 0}
                    >
                      <span className="truncate text-left">
                        {selectedModelItem
                          ? `${selectedModelItem.label}${selectedModelItem.isFree ? ' (Free)' : ''}`
                          : 'Выберите модель ИИ'}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[420px] max-w-[calc(100vw-3rem)] p-0"
                    align="start"
                    container={modelPopoverContainer}
                  >
                    <Command>
                      <div className="flex items-center gap-2 border-b p-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={modelFilter === 'free' ? 'secondary' : 'outline'}
                          onClick={() => setModelFilter('free')}
                        >
                          Только free
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={modelFilter === 'all' ? 'secondary' : 'outline'}
                          onClick={() => setModelFilter('all')}
                        >
                          Все
                        </Button>
                      </div>
                      <CommandInput placeholder="Поиск модели по названию, id или провайдеру" />
                      <CommandList>
                        <CommandEmpty>Модели не найдены</CommandEmpty>
                        <CommandGroup heading={`Доступные модели (${visibleModelOptions.length})`}>
                          {visibleModelOptions.map((model) => (
                            <CommandItem
                              key={model.id}
                              value={`${model.label} ${model.id} ${model.provider}`}
                              onSelect={() => {
                                setSelectedModel(model.id);
                                setIsModelPopoverOpen(false);
                              }}
                              className="gap-2"
                            >
                              <Check
                                className={cn(
                                  'h-4 w-4 shrink-0',
                                  effectiveModel === model.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              <div className="flex min-w-0 flex-1 flex-col">
                                <span className="truncate text-sm">{model.label}</span>
                                <span className="truncate text-xs text-slate-500">
                                  {model.provider} · {model.id}
                                </span>
                              </div>
                              {model.isFree ? (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-emerald-200 text-emerald-700"
                                >
                                  Free
                                </Badge>
                              ) : null}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-slate-500">
                  Показано {visibleModelOptions.length} из {modelOptions.length} моделей с
                  поддержкой structured outputs
                </p>
                {!modelsQuery.isLoading && modelOptions.length === 0 ? (
                  <p className="text-xs text-amber-700">
                    Нет моделей с поддержкой structured outputs.
                  </p>
                ) : null}
                <p className="text-xs text-slate-500">Всего в каталоге: {allModelOptions.length}</p>
                {modelsQuery.isError ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void modelsQuery.refetch();
                    }}
                  >
                    Повторить загрузку моделей
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Типы вопросов</Label>
              <div className="flex flex-wrap gap-2">
                {AI_QUESTION_TYPES.map((type) => (
                  <Button
                    key={type}
                    type="button"
                    size="sm"
                    variant={selectedTypes[type] ? 'secondary' : 'outline'}
                    onClick={() => handleTypeToggle(type)}
                  >
                    {AI_QUESTION_TYPE_LABELS[type]}
                  </Button>
                ))}
              </div>
            </div>

            {generationError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {generationError}
              </p>
            ) : null}
          </div>

          <div className="space-y-3 self-start rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">Предпросмотр вопросов</p>
              <Badge variant="outline">{previewQuestions.length}</Badge>
            </div>

            {previewQuestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Нажмите "Сгенерировать вопросы", чтобы увидеть результат перед сохранением.
              </p>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {previewQuestions.map((question, index) => (
                  <div
                    key={`${question.title}-${index}`}
                    className="rounded-md border border-slate-200 bg-white p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <Badge variant="outline">{AI_QUESTION_TYPE_LABELS[question.type]}</Badge>
                      {question.required ? <Badge variant="outline">Обязательный</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-900">{question.title}</p>
                    {question.description ? (
                      <p className="mt-1 text-xs text-slate-600">{question.description}</p>
                    ) : null}

                    {question.options && question.options.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-700">
                        {question.options.map((option, optionIndex) => (
                          <p key={`${option.value}-${optionIndex}`}>
                            - {option.label} (вес: {option.weight ?? 0})
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {question.sliderBands && question.sliderBands.length > 0 ? (
                      <div className="mt-2 space-y-1 text-xs text-slate-700">
                        {question.sliderBands.map((band, bandIndex) => (
                          <p key={`${band.label}-${bandIndex}`}>
                            - {band.label}: {band.minValue}..{band.maxValue} (вес:{' '}
                            {band.weight ?? 0})
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleGenerate}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? 'Генерация...' : 'Сгенерировать вопросы'}
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={isCreating || previewQuestions.length === 0}
          >
            {isCreating ? 'Создание теста...' : 'Создать тест'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
