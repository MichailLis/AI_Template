import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerGeneratePrompt,
  useAdminControllerGetPromptModels,
} from '@/shared/api/generated/admin/admin';

import {
  AI_QUESTION_TYPES,
  buildAiQuestionGenerationPrompt,
  buildAiQuestionJsonSchema,
  parseAiQuestionsOutput,
} from '../lib/ai-generator-utils';
import { parseApiError } from '../lib/tests-utils';

import type {
  AdminPromptModelsResponseDtoModelsItem,
  CreateTestsTopicFromAiDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

export type ModelFilter = 'free' | 'all';

const DEFAULT_SELECTED_TYPES: Record<CreateTestsTopicFromAiDtoQuestionsItemType, boolean> = {
  OPEN_TEXT: true,
  SINGLE_CHOICE: true,
  MULTI_CHOICE: true,
  SLIDER: false,
};

interface UseAiTestGenerationParams {
  open: boolean;
}

export function useAiTestGeneration({ open }: UseAiTestGenerationParams) {
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

  const buildCreatePayload = (): CreateTestsTopicFromAiDto | null => {
    if (!topicTitle.trim()) {
      setGenerationError('Укажите тему теста');
      return null;
    }

    if (previewQuestions.length === 0) {
      setGenerationError('Сначала сгенерируйте вопросы');
      return null;
    }

    return {
      title: topicTitle.trim(),
      description: topicDescription.trim() || null,
      questions: previewQuestions,
    };
  };

  return {
    modelsQuery,
    generateMutation,
    topicTitle,
    topicDescription,
    generationTask,
    questionCount,
    modelFilter,
    selectedTypes,
    previewQuestions,
    generationError,
    allModelOptions,
    modelOptions,
    visibleModelOptions,
    effectiveModel,
    selectedModelItem,
    setTopicTitle,
    setTopicDescription,
    setGenerationTask,
    setQuestionCount,
    setModelFilter,
    setSelectedModel,
    handleTypeToggle,
    handleGenerate,
    buildCreatePayload,
  };
}

export type AiModelOption = AdminPromptModelsResponseDtoModelsItem;
