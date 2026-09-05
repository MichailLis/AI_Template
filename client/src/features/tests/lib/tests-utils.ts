import { parseApiError } from '@/shared/lib/api-error';
import { isRecord } from '@/shared/lib/type-guards';

import { getUniqueOptionValue } from './unique-option-value';

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
  UpsertTestsQuestionDtoSettings,
} from '@/shared/api/model';

export { parseApiError };

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
};

const isSettingsRecord = (value: unknown): value is UpsertTestsQuestionDtoSettings => {
  return isRecord(value);
};

const DEFAULT_SLIDER_MIN = '1';
const DEFAULT_SLIDER_MAX = '10';
const DEFAULT_SLIDER_STEP = '1';

export const createDraftId = () => Math.random().toString(36).slice(2, 10);

export const createEmptyOptionDraft = (): QuestionOptionDraft => ({
  id: createDraftId(),
  label: '',
  value: '',
  weight: '0',
});

export const createEmptySliderBandDraft = (
  values: Partial<Omit<QuestionSliderBandDraft, 'id'>> = {},
): QuestionSliderBandDraft => ({
  id: createDraftId(),
  minValue: '1',
  maxValue: '10',
  label: '',
  weight: '0',
  ...values,
});

export const createEmptyQuestionFormState = (): QuestionFormState => ({
  type: 'OPEN_TEXT',
  title: '',
  description: '',
  required: true,
  settingsText: '',
  sliderMin: DEFAULT_SLIDER_MIN,
  sliderMax: DEFAULT_SLIDER_MAX,
  sliderStep: DEFAULT_SLIDER_STEP,
  options: [createEmptyOptionDraft(), createEmptyOptionDraft()],
  sliderBands: [createEmptySliderBandDraft()],
});

export const isChoiceType = (type: QuestionType) =>
  type === 'SINGLE_CHOICE' || type === 'MULTI_CHOICE';

const parseSettings = (raw: string): UpsertTestsQuestionDtoSettings | undefined => {
  const value = raw.trim();
  if (!value) {
    return undefined;
  }

  const settings = JSON.parse(value) as unknown;
  if (!isSettingsRecord(settings)) {
    throw new Error('Дополнительные настройки должны быть JSON-объектом');
  }

  return settings;
};

const getSliderSettingsNumber = (
  settings: Record<string, unknown> | null,
  key: 'min' | 'max' | 'step',
  fallback: string,
) => {
  const value = settings?.[key];

  return typeof value === 'number' && Number.isFinite(value) ? String(value) : fallback;
};

const getSettingsTextWithoutSliderScale = (settings: unknown) => {
  if (settings === null || settings === undefined) {
    return '';
  }

  if (!isRecord(settings)) {
    return JSON.stringify(settings, null, 2);
  }

  const restSettings = { ...settings };
  delete restSettings.min;
  delete restSettings.max;
  delete restSettings.step;

  return Object.keys(restSettings).length > 0 ? JSON.stringify(restSettings, null, 2) : '';
};

const parseIntegerField = (value: string, label: string) => {
  const normalizedValue = value.trim();
  const parsedValue = Number(normalizedValue);

  if (!normalizedValue || !Number.isInteger(parsedValue)) {
    throw new Error(`${label} должно быть целым числом`);
  }

  return parsedValue;
};

const parseSliderScale = (form: QuestionFormState) => {
  const min = parseIntegerField(form.sliderMin, 'Минимум шкалы');
  const max = parseIntegerField(form.sliderMax, 'Максимум шкалы');
  const step = parseIntegerField(form.sliderStep, 'Шаг шкалы');

  if (max <= min) {
    throw new Error('Максимум шкалы должен быть больше минимума');
  }

  if (step <= 0) {
    throw new Error('Шаг шкалы должен быть больше нуля');
  }

  return { min, max, step };
};

const parseSliderSettings = (
  form: QuestionFormState,
  sliderScale: { min: number; max: number; step: number },
) => {
  const settings = parseSettings(form.settingsText);

  if (settings === undefined) {
    return sliderScale;
  }

  return {
    ...settings,
    ...sliderScale,
  };
};

const normalizeOptionValue = (label: string) =>
  label.trim().toLowerCase().replace(/\s+/g, '_').replace(/\|/g, '');

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
    const value = getUniqueOptionValue(rawValue, usedValues, index);

    const weight = Number.parseInt(option.weight.trim() || '0', 10);
    if (Number.isNaN(weight)) {
      throw new Error(`Вариант ${index + 1}: вес должен быть целым числом`);
    }

    return { label, value, weight };
  });
};

const parseSliderBandsDraft = (
  drafts: QuestionSliderBandDraft[],
  scale: { min: number; max: number },
) => {
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
      throw new Error(`Диапазон ${index + 1}: границы должны быть целыми числами`);
    }

    if (maxValue <= minValue) {
      throw new Error(`Диапазон ${index + 1}: значение "До" должно быть больше "От"`);
    }

    if (minValue < scale.min || maxValue > scale.max) {
      throw new Error(`Диапазон ${index + 1}: границы должны быть внутри шкалы`);
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

const getQuestionSettingsText = (question: TestsTopicDetailResponseDtoDraftQuestionsItem) => {
  if (question.type === 'SLIDER') {
    return getSettingsTextWithoutSliderScale(question.settings);
  }

  if (question.settings === null || question.settings === undefined) {
    return '';
  }

  return JSON.stringify(question.settings, null, 2);
};

export const createQuestionPayload = (form: QuestionFormState): UpsertTestsQuestionDto => {
  const title = form.title.trim();
  if (!title) {
    throw new Error('Укажите заголовок вопроса');
  }

  const sliderScale = form.type === 'SLIDER' ? parseSliderScale(form) : null;

  return {
    type: form.type,
    title,
    description: form.description.trim() || null,
    required: form.required,
    settings:
      form.type === 'SLIDER' && sliderScale
        ? parseSliderSettings(form, sliderScale)
        : parseSettings(form.settingsText),
    options: isChoiceType(form.type) ? parseOptionsDraft(form.options) : undefined,
    sliderBands:
      form.type === 'SLIDER' && sliderScale
        ? parseSliderBandsDraft(form.sliderBands, sliderScale)
        : undefined,
  };
};

export const buildQuestionFormFromQuestion = (
  question: TestsTopicDetailResponseDtoDraftQuestionsItem,
) => {
  const settingsRecord = isRecord(question.settings) ? question.settings : null;

  return {
    type: question.type as QuestionType,
    title: question.title,
    description: question.description ?? '',
    required: question.required,
    settingsText: getQuestionSettingsText(question),
    sliderMin: getSliderSettingsNumber(settingsRecord, 'min', DEFAULT_SLIDER_MIN),
    sliderMax: getSliderSettingsNumber(settingsRecord, 'max', DEFAULT_SLIDER_MAX),
    sliderStep: getSliderSettingsNumber(settingsRecord, 'step', DEFAULT_SLIDER_STEP),
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
  };
};

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
