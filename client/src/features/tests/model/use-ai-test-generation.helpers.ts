import type {
  CreateTestsTopicFromAiDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

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
