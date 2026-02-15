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

import {
  buildCreatePayloadResult,
  DEFAULT_SELECTED_TYPES,
  resolveEffectiveModel,
  validateGenerationInput,
} from './use-ai-test-generation.helpers';

import type {
  AdminPromptModelsResponseDtoModelsItem,
  CreateTestsTopicFromAiDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

export type ModelFilter = 'free' | 'all';

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

  const effectiveModel = useMemo(
    () =>
      resolveEffectiveModel({
        selectedModel,
        visibleModelOptions,
        modelOptions,
        defaultModel: modelsQuery.data?.defaultModel,
      }),
    [modelOptions, modelsQuery.data?.defaultModel, selectedModel, visibleModelOptions],
  );

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
    const validation = validateGenerationInput({
      topicTitle,
      generationTask,
      effectiveModel,
      allowedTypes,
      questionCount,
    });

    if (!validation.ok) {
      setGenerationError(validation.error);
      return;
    }

    const parsedQuestionCount = validation.parsedQuestionCount;

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
    const payloadResult = buildCreatePayloadResult({
      topicTitle,
      topicDescription,
      previewQuestions,
    });

    if (!payloadResult.ok) {
      setGenerationError(payloadResult.error);
      return null;
    }

    return payloadResult.payload;
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
