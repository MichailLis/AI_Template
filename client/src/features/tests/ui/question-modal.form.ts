import {
  createEmptyOptionDraft,
  createEmptySliderBandDraft,
  isChoiceType,
} from '../lib/tests-utils';

import type { QuestionFormState, QuestionType } from '../model/types';

export const getQuestionModalSubmitLabel = (mode: 'create' | 'edit', isSubmitting: boolean) => {
  if (isSubmitting) {
    return 'Сохранение...';
  }

  return mode === 'edit' ? 'Обновить вопрос' : 'Добавить вопрос';
};

export const withUpdatedQuestionType = (form: QuestionFormState, type: QuestionType) => {
  let nextOptions = form.options;
  let nextSliderBands = form.sliderBands;

  if (isChoiceType(type) && nextOptions.length === 0) {
    nextOptions = [createEmptyOptionDraft(), createEmptyOptionDraft()];
  }

  if (type === 'SLIDER' && nextSliderBands.length === 0) {
    nextSliderBands = [createEmptySliderBandDraft()];
  }

  return {
    ...form,
    type,
    options: nextOptions,
    sliderBands: nextSliderBands,
  };
};

export const withUpdatedOption = (
  form: QuestionFormState,
  optionId: string,
  field: 'label' | 'weight',
  value: string,
) => {
  return {
    ...form,
    options: form.options.map((option) =>
      option.id === optionId ? { ...option, [field]: value } : option,
    ),
  };
};

export const withAddedOption = (form: QuestionFormState) => {
  return {
    ...form,
    options: [...form.options, createEmptyOptionDraft()],
  };
};

export const withRemovedOption = (form: QuestionFormState, optionId: string) => {
  if (form.options.length <= 2) {
    return form;
  }

  return {
    ...form,
    options: form.options.filter((option) => option.id !== optionId),
  };
};

export const withUpdatedSliderBand = (
  form: QuestionFormState,
  bandId: string,
  field: 'minValue' | 'maxValue' | 'label' | 'weight',
  value: string,
) => {
  return {
    ...form,
    sliderBands: form.sliderBands.map((band) =>
      band.id === bandId ? { ...band, [field]: value } : band,
    ),
  };
};

export const withUpdatedSliderScale = (
  form: QuestionFormState,
  field: 'sliderMin' | 'sliderMax' | 'sliderStep',
  value: string,
) => {
  return {
    ...form,
    [field]: value,
  };
};

export const withAddedSliderBand = (form: QuestionFormState) => {
  const lastBand = form.sliderBands[form.sliderBands.length - 1];
  const scaleMax = Number(form.sliderMax.trim());
  const lastMax = Number(lastBand?.maxValue.trim());
  const nextMin = Number.isFinite(lastMax) ? lastMax + 1 : Number(form.sliderMin.trim());
  const canSuggestRange =
    Number.isFinite(nextMin) && Number.isFinite(scaleMax) && nextMin <= scaleMax;

  return {
    ...form,
    sliderBands: [
      ...form.sliderBands,
      createEmptySliderBandDraft(
        canSuggestRange
          ? { minValue: String(nextMin), maxValue: String(scaleMax) }
          : { minValue: '', maxValue: '' },
      ),
    ],
  };
};

export const withRemovedSliderBand = (form: QuestionFormState, bandId: string) => {
  if (form.sliderBands.length <= 1) {
    return form;
  }

  return {
    ...form,
    sliderBands: form.sliderBands.filter((band) => band.id !== bandId),
  };
};
