import type {
  QuestionFormState,
  QuestionOptionDraft,
  QuestionSliderBandDraft,
  QuestionType,
} from '../model/types';
import type {
  TestsTopicDetailResponseDtoDraft,
  TestsTopicDetailResponseDtoDraftQuestionsItem,
  UpsertTestsQuestionDto,
} from '@/shared/api/model';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const extractErrorMessage = (data: Record<string, unknown>) => {
  const nestedError = data.error;

  if (isRecord(nestedError) && 'message' in nestedError) {
    return String(nestedError.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return null;
};

export const parseApiError = (error: unknown) => {
  if (!isRecord(error)) {
    return 'Не удалось выполнить запрос';
  }

  if ('response' in error && isRecord(error.response)) {
    const response = error.response;

    if ('status' in response && response.status === 401) {
      return 'Сессия истекла или доступ запрещен. Войдите заново.';
    }

    if ('data' in response && isRecord(response.data)) {
      const message = extractErrorMessage(response.data);
      if (message) {
        return message;
      }
    }
  }

  if ('request' in error) {
    return 'Сервер недоступен. Проверьте, что backend запущен на localhost:3000.';
  }

  return 'Не удалось выполнить запрос';
};

export const createDraftId = () => Math.random().toString(36).slice(2, 10);

export const createEmptyOptionDraft = (): QuestionOptionDraft => ({
  id: createDraftId(),
  label: '',
  value: '',
  weight: '0',
});

export const createEmptySliderBandDraft = (): QuestionSliderBandDraft => ({
  id: createDraftId(),
  minValue: '1',
  maxValue: '10',
  label: '',
  weight: '0',
});

export const createEmptyQuestionFormState = (): QuestionFormState => ({
  type: 'OPEN_TEXT',
  title: '',
  description: '',
  required: true,
  settingsText: '',
  options: [createEmptyOptionDraft(), createEmptyOptionDraft()],
  sliderBands: [createEmptySliderBandDraft()],
});

export const isChoiceType = (type: QuestionType) =>
  type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';

const parseSettings = (raw: string) => {
  const value = raw.trim();
  if (!value) {
    return undefined;
  }

  return JSON.parse(value) as unknown;
};

const normalizeOptionValue = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, '_').replace(/\|/g, '');

const getUniqueValue = (baseValue: string, usedValues: Set<string>, index: number) => {
  const normalizedBase = baseValue || `option_${index + 1}`;

  if (!usedValues.has(normalizedBase)) {
    usedValues.add(normalizedBase);
    return normalizedBase;
  }

  let suffix = 2;
  let candidate = `${normalizedBase}_${suffix}`;
  while (usedValues.has(candidate)) {
    suffix += 1;
    candidate = `${normalizedBase}_${suffix}`;
  }

  usedValues.add(candidate);
  return candidate;
};

const parseOptionsDraft = (drafts: QuestionOptionDraft[]) => {
  const nonEmptyDrafts = drafts.filter(
    (option) => option.label.trim() || option.value.trim() || option.weight.trim(),
  );

  if (nonEmptyDrafts.length < 2) {
    throw new Error('Добавьте минимум два варианта ответа');
  }

  const usedValues = new Set<string>();

  return nonEmptyDrafts.map((option, index) => {
    const label = option.label.trim();
    if (!label) {
      throw new Error(`Вариант ${index + 1}: заполните текст`);
    }

    const rawValue = option.value.trim() || normalizeOptionValue(label);
    const value = getUniqueValue(rawValue, usedValues, index);

    const weight = Number.parseInt(option.weight.trim() || '0', 10);
    if (Number.isNaN(weight)) {
      throw new Error(`Вариант ${index + 1}: вес должен быть целым числом`);
    }

    return { label, value, weight };
  });
};

const parseSliderBandsDraft = (drafts: QuestionSliderBandDraft[]) => {
  const nonEmptyDrafts = drafts.filter(
    (band) =>
      band.minValue.trim() || band.maxValue.trim() || band.label.trim() || band.weight.trim(),
  );

  if (nonEmptyDrafts.length === 0) {
    throw new Error('Добавьте минимум один диапазон слайдера');
  }

  return nonEmptyDrafts.map((band, index) => {
    const minValue = Number.parseInt(band.minValue.trim(), 10);
    const maxValue = Number.parseInt(band.maxValue.trim(), 10);
    const weight = Number.parseInt(band.weight.trim() || '0', 10);
    const label = band.label.trim();

    if (Number.isNaN(minValue) || Number.isNaN(maxValue)) {
      throw new Error(`Диапазон ${index + 1}: min и max должны быть целыми числами`);
    }

    if (maxValue <= minValue) {
      throw new Error(`Диапазон ${index + 1}: max должен быть больше min`);
    }

    if (!label) {
      throw new Error(`Диапазон ${index + 1}: заполните название`);
    }

    if (Number.isNaN(weight)) {
      throw new Error(`Диапазон ${index + 1}: вес должен быть целым числом`);
    }

    return { minValue, maxValue, label, weight };
  });
};

export const createQuestionPayload = (form: QuestionFormState): UpsertTestsQuestionDto => {
  const title = form.title.trim();
  if (!title) {
    throw new Error('Укажите заголовок вопроса');
  }

  return {
    type: form.type,
    title,
    description: form.description.trim() || null,
    required: form.required,
    settings: parseSettings(form.settingsText),
    options: isChoiceType(form.type) ? parseOptionsDraft(form.options) : undefined,
    sliderBands: form.type === 'SLIDER' ? parseSliderBandsDraft(form.sliderBands) : undefined,
  };
};

export const buildQuestionFormFromQuestion = (
  question: TestsTopicDetailResponseDtoDraftQuestionsItem,
): QuestionFormState => ({
  type: question.type as QuestionType,
  title: question.title,
  description: question.description ?? '',
  required: question.required,
  settingsText:
    question.settings === null || question.settings === undefined
      ? ''
      : JSON.stringify(question.settings, null, 2),
  options:
    question.options.length > 0
      ? question.options.map((option) => ({
          id: createDraftId(),
          label: option.label,
          value: option.value,
          weight: String(option.weight),
        }))
      : [createEmptyOptionDraft(), createEmptyOptionDraft()],
  sliderBands:
    question.sliderBands.length > 0
      ? question.sliderBands.map((band) => ({
          id: createDraftId(),
          minValue: String(band.minValue),
          maxValue: String(band.maxValue),
          label: band.label,
          weight: String(band.weight),
        }))
      : [createEmptySliderBandDraft()],
});

export const hasDraftEdits = (
  draft: TestsTopicDetailResponseDtoDraft,
  title: string,
  description: string,
  analysisPromptVersionId: number | null,
) =>
  title !== draft.title ||
  description !== (draft.description ?? '') ||
  analysisPromptVersionId !== (draft.analysisPromptVersion?.id ?? null);

export const hasQuestionFormChanges = (
  current: QuestionFormState,
  initial: QuestionFormState | null,
) => {
  if (!initial) {
    return false;
  }

  return JSON.stringify(current) !== JSON.stringify(initial);
};
