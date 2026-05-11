import { type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import {
  buildAiQuestionGenerationPrompt,
  buildAiQuestionJsonSchema,
  parseAiQuestionsOutput,
} from '../lib/ai-generator-utils';
import { parseApiError } from '../lib/tests-utils';

import type {
  AdminPromptResponseDto,
  CreateTestsTopicFromAiDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
  GeneratePromptDto,
} from '@/shared/api/model';

type AiGenerationMutate = (
  variables: { data: GeneratePromptDto },
  options: {
    onSuccess: (result: AdminPromptResponseDto) => void;
    onError: (error: unknown) => void;
  },
) => void;

interface ExecuteAiGenerationParams {
  topicTitle: string;
  topicDescription: string;
  generationTask: string;
  effectiveModel: string;
  allowedTypes: CreateTestsTopicFromAiDtoQuestionsItemType[];
  parsedQuestionCount: number;
  setGenerationError: (error: string | null) => void;
  setPreviewQuestions: (questions: CreateTestsTopicFromAiDtoQuestionsItem[]) => void;
  mutate: AiGenerationMutate;
}

export const handleTypeToggle = ({
  type,
  setSelectedTypes,
}: {
  type: CreateTestsTopicFromAiDtoQuestionsItemType;
  setSelectedTypes: Dispatch<
    SetStateAction<Record<CreateTestsTopicFromAiDtoQuestionsItemType, boolean>>
  >;
}) => {
  setSelectedTypes((previous) => ({
    ...previous,
    [type]: !previous[type],
  }));
};

const buildGenerateVariables = ({
  topicTitle,
  topicDescription,
  generationTask,
  effectiveModel,
  parsedQuestionCount,
  allowedTypes,
}: {
  topicTitle: string;
  topicDescription: string;
  generationTask: string;
  effectiveModel: string;
  parsedQuestionCount: number;
  allowedTypes: CreateTestsTopicFromAiDtoQuestionsItemType[];
}): { data: GeneratePromptDto } => {
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

  return {
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
  };
};

const handleGenerateSuccess = ({
  result,
  parsedQuestionCount,
  allowedTypes,
  setPreviewQuestions,
  setGenerationError,
}: {
  result: AdminPromptResponseDto;
  parsedQuestionCount: number;
  allowedTypes: CreateTestsTopicFromAiDtoQuestionsItemType[];
  setPreviewQuestions: (questions: CreateTestsTopicFromAiDtoQuestionsItem[]) => void;
  setGenerationError: (error: string | null) => void;
}) => {
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
    const message = error instanceof Error ? error.message : 'Не удалось разобрать ответ ИИ';
    setPreviewQuestions([]);
    setGenerationError(message);
  }
};

const handleGenerateError = ({
  error,
  setPreviewQuestions,
  setGenerationError,
}: {
  error: unknown;
  setPreviewQuestions: (questions: CreateTestsTopicFromAiDtoQuestionsItem[]) => void;
  setGenerationError: (error: string | null) => void;
}) => {
  const message = parseApiError(error);
  setPreviewQuestions([]);
  setGenerationError(message);
  toast.error(message);
};

export const executeAiGeneration = ({
  topicTitle,
  topicDescription,
  generationTask,
  effectiveModel,
  allowedTypes,
  parsedQuestionCount,
  setGenerationError,
  setPreviewQuestions,
  mutate,
}: ExecuteAiGenerationParams) => {
  const variables = buildGenerateVariables({
    topicTitle,
    topicDescription,
    generationTask,
    effectiveModel,
    parsedQuestionCount,
    allowedTypes,
  });

  mutate(variables, {
    onSuccess: (result) => {
      handleGenerateSuccess({
        result,
        parsedQuestionCount,
        allowedTypes,
        setPreviewQuestions,
        setGenerationError,
      });
    },
    onError: (error) => {
      handleGenerateError({
        error,
        setPreviewQuestions,
        setGenerationError,
      });
    },
  });
};

interface CreatePayloadContext {
  topicTitle: string;
  topicDescription: string;
  previewQuestions: CreateTestsTopicFromAiDtoQuestionsItem[];
  setGenerationError: (error: string | null) => void;
}

export const buildCreatePayload = ({
  topicTitle,
  topicDescription,
  previewQuestions,
  setGenerationError,
}: CreatePayloadContext): CreateTestsTopicFromAiDto | null => {
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

interface HandleGenerateParams {
  topicTitle: string;
  topicDescription: string;
  generationTask: string;
  questionCount: string;
  effectiveModel: string;
  allowedTypes: CreateTestsTopicFromAiDtoQuestionsItemType[];
  setGenerationError: (error: string | null) => void;
  setPreviewQuestions: (questions: CreateTestsTopicFromAiDtoQuestionsItem[]) => void;
  mutate: AiGenerationMutate;
}

export const handleGeneration = ({
  topicTitle,
  topicDescription,
  generationTask,
  questionCount,
  effectiveModel,
  allowedTypes,
  setGenerationError,
  setPreviewQuestions,
  mutate,
}: HandleGenerateParams) => {
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

  setGenerationError(null);

  executeAiGeneration({
    topicTitle,
    topicDescription,
    generationTask,
    effectiveModel,
    allowedTypes,
    parsedQuestionCount: validation.parsedQuestionCount,
    setGenerationError,
    setPreviewQuestions,
    mutate,
  });
};

export const DEFAULT_SELECTED_TYPES: Record<CreateTestsTopicFromAiDtoQuestionsItemType, boolean> = {
  OPEN_TEXT: true,
  SINGLE_CHOICE: true,
  MULTI_CHOICE: true,
  SLIDER: false,
};

interface ResolveEffectiveModelParams {
  selectedModel: string;
  visibleModelOptions: Array<{ id: string; isFree?: boolean }>;
  modelOptions: Array<{ id: string }>;
  defaultModel?: string;
}

export const resolveEffectiveModel = ({
  selectedModel,
  visibleModelOptions,
  modelOptions,
  defaultModel,
}: ResolveEffectiveModelParams) => {
  const isSelectedVisible = selectedModel
    ? visibleModelOptions.some((model) => model.id === selectedModel)
    : false;

  if (isSelectedVisible) {
    return selectedModel;
  }

  const defaultFreeVisibleModel = visibleModelOptions.find((model) => model.isFree)?.id;
  if (defaultFreeVisibleModel) {
    return defaultFreeVisibleModel;
  }

  if (defaultModel && modelOptions.some((model) => model.id === defaultModel)) {
    return defaultModel;
  }

  return visibleModelOptions[0]?.id || '';
};

interface ValidateGenerationInputParams {
  topicTitle: string;
  generationTask: string;
  effectiveModel: string;
  allowedTypes: CreateTestsTopicFromAiDtoQuestionsItemType[];
  questionCount: string;
}

type GenerationValidationResult =
  | { ok: true; parsedQuestionCount: number }
  | { ok: false; error: string };

export const validateGenerationInput = ({
  topicTitle,
  generationTask,
  effectiveModel,
  allowedTypes,
  questionCount,
}: ValidateGenerationInputParams): GenerationValidationResult => {
  if (!topicTitle.trim()) {
    return { ok: false, error: 'Укажите тему теста' };
  }

  if (!generationTask.trim()) {
    return { ok: false, error: 'Опишите, что именно должен генерировать ИИ' };
  }

  if (!effectiveModel) {
    return { ok: false, error: 'Не удалось выбрать модель ИИ' };
  }

  if (allowedTypes.length === 0) {
    return { ok: false, error: 'Выберите хотя бы один тип вопроса' };
  }

  const parsedQuestionCount = Number.parseInt(questionCount, 10);
  if (Number.isNaN(parsedQuestionCount) || parsedQuestionCount < 1 || parsedQuestionCount > 60) {
    return { ok: false, error: 'Количество вопросов должно быть от 1 до 60' };
  }

  return { ok: true, parsedQuestionCount };
};

interface BuildCreatePayloadParams {
  topicTitle: string;
  topicDescription: string;
  previewQuestions: CreateTestsTopicFromAiDtoQuestionsItem[];
}

type BuildCreatePayloadResult =
  | { ok: true; payload: CreateTestsTopicFromAiDto }
  | { ok: false; error: string };

export const buildCreatePayloadResult = ({
  topicTitle,
  topicDescription,
  previewQuestions,
}: BuildCreatePayloadParams): BuildCreatePayloadResult => {
  if (!topicTitle.trim()) {
    return { ok: false, error: 'Укажите тему теста' };
  }

  if (previewQuestions.length === 0) {
    return { ok: false, error: 'Сначала сгенерируйте вопросы' };
  }

  return {
    ok: true,
    payload: {
      title: topicTitle.trim(),
      description: topicDescription.trim() || null,
      questions: previewQuestions,
    },
  };
};
