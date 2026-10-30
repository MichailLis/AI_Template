import { type Dispatch, type SetStateAction } from 'react';
import { toast } from 'sonner';

import { parseAiQuestionsOutput } from '../lib/ai-generator-utils';
import { parseApiError } from '../lib/tests-utils';

import {
  buildCreatePayloadResult,
  buildGenerateVariables,
  validateGenerationInput,
} from './ai-test-generation.rules';

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
