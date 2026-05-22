import { useMemo, useState } from 'react';

import {
  useAnalysisPromptsControllerGeneratePrompt,
  useAnalysisPromptsControllerGetPromptModels,
} from '@/shared/api/generated/admin/admin';

import { AI_QUESTION_TYPES } from '../lib/ai-generator-utils';

import {
  buildCreatePayload,
  handleGeneration,
  handleTypeToggle,
  DEFAULT_SELECTED_TYPES,
  resolveEffectiveModel,
} from './use-ai-test-generation.helpers';

import type {
  AdminPromptModelsResponseDtoModelsItem,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

export type ModelFilter = 'free' | 'all';

interface UseAiTestGenerationParams {
  open: boolean;
}

export function useAiTestGeneration({ open }: UseAiTestGenerationParams) {
  const modelsQuery = useAnalysisPromptsControllerGetPromptModels({
    query: {
      enabled: open,
      staleTime: 5 * 60 * 1000,
    },
  });
  const generateMutation = useAnalysisPromptsControllerGeneratePrompt();

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

  const handleGenerate = () => {
    handleGeneration({
      topicTitle,
      topicDescription,
      generationTask,
      questionCount,
      effectiveModel,
      allowedTypes,
      setGenerationError,
      setPreviewQuestions,
      mutate: generateMutation.mutate,
    });
  };

  const buildCreatePayloadHandler = () =>
    buildCreatePayload({
      topicTitle,
      topicDescription,
      previewQuestions,
      setGenerationError,
    });

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
    handleTypeToggle: (type: CreateTestsTopicFromAiDtoQuestionsItemType) =>
      handleTypeToggle({
        type,
        setSelectedTypes,
      }),
    handleGenerate,
    buildCreatePayload: buildCreatePayloadHandler,
  };
}

export type AiModelOption = AdminPromptModelsResponseDtoModelsItem;
