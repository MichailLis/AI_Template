import { z } from 'zod';

import { getUniqueOptionValue } from './unique-option-value';

import type {
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

const trimUnderscoreEdges = (value: string) => {
  let start = 0;
  let end = value.length;

  while (start < end && value[start] === '_') {
    start += 1;
  }

  while (end > start && value[end - 1] === '_') {
    end -= 1;
  }

  return value.slice(start, end);
};

const toSlugLikeValue = (value: string) =>
  trimUnderscoreEdges(
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]+/g, ''),
  );

const extractFencedJson = (value: string) => {
  const openFenceIndex = value.indexOf('```');
  if (openFenceIndex < 0) {
    return null;
  }

  const closeFenceIndex = value.indexOf('```', openFenceIndex + 3);
  if (closeFenceIndex < 0) {
    return null;
  }

  let fencedContent = value.slice(openFenceIndex + 3, closeFenceIndex).trim();
  if (fencedContent.toLowerCase().startsWith('json')) {
    fencedContent = fencedContent.slice(4).trim();
  }

  return fencedContent || null;
};

const AiOptionSchema = z.object({
  label: z.string().min(1).max(400),
  value: z.string().min(1).max(400).optional(),
  weight: z.number().int().min(-1000).max(1000).optional(),
});

const AiSliderBandSchema = z.object({
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string().min(1).max(400),
  weight: z.number().int().min(-1000).max(1000).optional(),
});

const AiQuestionSchema = z.object({
  type: z.enum(['OPEN_TEXT', 'SINGLE_CHOICE', 'MULTI_CHOICE', 'SLIDER']),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  required: z.boolean().optional(),
  settings: z.unknown().optional(),
  options: z.array(AiOptionSchema).optional(),
  sliderBands: z.array(AiSliderBandSchema).optional(),
});

const AiQuestionsOutputSchema = z.object({
  questions: z.array(AiQuestionSchema).min(1).max(60),
});

const extractFirstJsonObject = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error('ИИ вернул пустой ответ');
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    const fenced = extractFencedJson(trimmed);
    if (fenced) {
      return JSON.parse(fenced) as unknown;
    }
    throw new Error('ИИ вернул невалидный JSON');
  }
};

interface ParseAiQuestionsOutputParams {
  rawOutput: string;
  expectedQuestionCount: number;
  allowedTypes: Array<CreateTestsTopicFromAiDtoQuestionsItemType>;
}

export const parseAiQuestionsOutput = ({
  rawOutput,
  expectedQuestionCount,
  allowedTypes,
}: ParseAiQuestionsOutputParams): CreateTestsTopicFromAiDtoQuestionsItem[] => {
  const parsed = extractFirstJsonObject(rawOutput);
  const result = AiQuestionsOutputSchema.safeParse(parsed);

  if (!result.success) {
    const [firstIssue] = result.error.issues;
    throw new Error(firstIssue?.message ?? 'Невалидный формат ответа ИИ');
  }

  if (result.data.questions.length !== expectedQuestionCount) {
    throw new Error(
      `ИИ вернул ${result.data.questions.length} вопросов вместо ${expectedQuestionCount}`,
    );
  }

  const allowedTypeSet = new Set(allowedTypes);

  return result.data.questions.map((question, index) => {
    if (!allowedTypeSet.has(question.type)) {
      throw new Error(`Вопрос ${index + 1}: тип ${question.type} не входит в выбранные`);
    }

    if (question.type === 'OPEN_TEXT') {
      return {
        type: question.type,
        title: question.title.trim(),
        description: question.description?.trim() || null,
        required: question.required ?? true,
      };
    }

    if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE') {
      const options = question.options ?? [];
      if (options.length < 2) {
        throw new Error(`Вопрос ${index + 1}: для выбора нужно минимум 2 варианта`);
      }

      const usedValues = new Set<string>();
      const normalizedOptions = options.map((option, optionIndex) => {
        const normalizedValue =
          toSlugLikeValue(option.value ?? '') || toSlugLikeValue(option.label);
        const value = getUniqueOptionValue(normalizedValue, usedValues, optionIndex);

        return {
          label: option.label.trim(),
          value,
          weight: option.weight ?? 0,
        };
      });

      return {
        type: question.type,
        title: question.title.trim(),
        description: question.description?.trim() || null,
        required: question.required ?? true,
        options: normalizedOptions,
      };
    }

    const sliderBands = question.sliderBands ?? [];
    if (sliderBands.length === 0) {
      throw new Error(`Вопрос ${index + 1}: для слайдера нужен минимум один диапазон`);
    }

    const settingsRecord =
      typeof question.settings === 'object' && question.settings !== null
        ? (question.settings as Record<string, unknown>)
        : null;

    const min = typeof settingsRecord?.min === 'number' ? settingsRecord.min : null;
    const max = typeof settingsRecord?.max === 'number' ? settingsRecord.max : null;
    const step = typeof settingsRecord?.step === 'number' ? settingsRecord.step : null;

    if (min === null || max === null || step === null || max <= min || step <= 0) {
      throw new Error(`Вопрос ${index + 1}: у слайдера некорректные settings (min/max/step)`);
    }

    return {
      type: question.type,
      title: question.title.trim(),
      description: question.description?.trim() || null,
      required: question.required ?? true,
      settings: { min, max, step },
      sliderBands: sliderBands.map((band) => ({
        minValue: band.minValue,
        maxValue: band.maxValue,
        label: band.label.trim(),
        weight: band.weight ?? 0,
      })),
    };
  });
};
