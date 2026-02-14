import { z } from 'zod';

import type {
  CreateTestsTopicFromAiDtoQuestionsItem,
  CreateTestsTopicFromAiDtoQuestionsItemType,
} from '@/shared/api/model';

export const AI_QUESTION_TYPE_LABELS: Record<CreateTestsTopicFromAiDtoQuestionsItemType, string> = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
};

export const AI_QUESTION_TYPES = Object.keys(
  AI_QUESTION_TYPE_LABELS,
) as Array<CreateTestsTopicFromAiDtoQuestionsItemType>;

interface BuildAiPromptParams {
  topicTitle: string;
  topicDescription: string;
  generationTask: string;
  questionCount: number;
  allowedTypes: Array<CreateTestsTopicFromAiDtoQuestionsItemType>;
}

interface BuildAiQuestionJsonSchemaParams {
  questionCount: number;
  allowedTypes: Array<CreateTestsTopicFromAiDtoQuestionsItemType>;
}

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

const getUniqueOptionValue = (proposed: string, usedValues: Set<string>, index: number) => {
  const base = proposed || `option_${index + 1}`;

  if (!usedValues.has(base)) {
    usedValues.add(base);
    return base;
  }

  let suffix = 2;
  let candidate = `${base}_${suffix}`;
  while (usedValues.has(candidate)) {
    suffix += 1;
    candidate = `${base}_${suffix}`;
  }

  usedValues.add(candidate);
  return candidate;
};

export const buildAiQuestionGenerationPrompt = ({
  topicTitle,
  topicDescription,
  generationTask,
  questionCount,
  allowedTypes,
}: BuildAiPromptParams) => {
  const typeLabels = allowedTypes.map((type) => `${type} (${AI_QUESTION_TYPE_LABELS[type]})`);

  return [
    'Ты проектируешь структуру теста для админки образовательного продукта.',
    'Ответ должен быть СТРОГО JSON-объектом без markdown и без дополнительного текста.',
    'Верни JSON формата:',
    '{',
    '  "questions": [',
    '    {',
    '      "type": "OPEN_TEXT | SINGLE_CHOICE | MULTI_CHOICE | SLIDER",',
    '      "title": "string",',
    '      "description": "string|null",',
    '      "required": true,',
    '      "options": [{ "label": "string", "value": "string", "weight": 0 }],',
    '      "settings": { "min": 0, "max": 10, "step": 1 },',
    '      "sliderBands": [{ "minValue": 0, "maxValue": 3, "label": "string", "weight": 0 }]',
    '    }',
    '  ]',
    '}',
    '',
    'Ограничения:',
    `1) Ровно ${questionCount} вопросов.`,
    `2) Допустимые типы: ${typeLabels.join(', ')}.`,
    '3) Для OPEN_TEXT не добавляй options и sliderBands.',
    '4) Для SINGLE_CHOICE и MULTI_CHOICE минимум 2 options.',
    '5) Для SLIDER обязательно заполни settings (min/max/step) и минимум 1 sliderBands.',
    '6) Для options.weight и sliderBands.weight используй целые числа от -1000 до 1000.',
    '7) Формулировки вопросов и вариантов ответа — на русском языке.',
    '',
    `Тема теста: ${topicTitle}`,
    `Описание теста: ${topicDescription || 'не задано'}`,
    `Задача/контекст: ${generationTask}`,
  ].join('\n');
};

export const buildAiQuestionJsonSchema = ({
  questionCount,
  allowedTypes,
}: BuildAiQuestionJsonSchemaParams): Record<string, unknown> => {
  const openTextQuestionSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'title', 'required'],
    properties: {
      type: { type: 'string', enum: ['OPEN_TEXT'] },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: {
        anyOf: [{ type: 'string', maxLength: 2000 }, { type: 'null' }],
      },
      required: { type: 'boolean' },
    },
  };

  const choiceQuestionSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'title', 'required', 'options'],
    properties: {
      type: { type: 'string', enum: ['SINGLE_CHOICE', 'MULTI_CHOICE'] },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: {
        anyOf: [{ type: 'string', maxLength: 2000 }, { type: 'null' }],
      },
      required: { type: 'boolean' },
      options: {
        type: 'array',
        minItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'value', 'weight'],
          properties: {
            label: { type: 'string', minLength: 1, maxLength: 400 },
            value: { type: 'string', minLength: 1, maxLength: 400 },
            weight: {
              type: 'integer',
              minimum: -1000,
              maximum: 1000,
            },
          },
        },
      },
    },
  };

  const sliderQuestionSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['type', 'title', 'required', 'settings', 'sliderBands'],
    properties: {
      type: { type: 'string', enum: ['SLIDER'] },
      title: { type: 'string', minLength: 1, maxLength: 200 },
      description: {
        anyOf: [{ type: 'string', maxLength: 2000 }, { type: 'null' }],
      },
      required: { type: 'boolean' },
      settings: {
        type: 'object',
        additionalProperties: false,
        required: ['min', 'max', 'step'],
        properties: {
          min: { type: 'number' },
          max: { type: 'number' },
          step: {
            type: 'number',
            exclusiveMinimum: 0,
          },
        },
      },
      sliderBands: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['minValue', 'maxValue', 'label', 'weight'],
          properties: {
            minValue: { type: 'integer' },
            maxValue: { type: 'integer' },
            label: { type: 'string', minLength: 1, maxLength: 400 },
            weight: {
              type: 'integer',
              minimum: -1000,
              maximum: 1000,
            },
          },
        },
      },
    },
  };

  const questionVariants: Record<string, unknown>[] = [];

  if (allowedTypes.includes('OPEN_TEXT')) {
    questionVariants.push(openTextQuestionSchema);
  }

  if (allowedTypes.includes('SINGLE_CHOICE') || allowedTypes.includes('MULTI_CHOICE')) {
    const choiceTypeEnum: string[] = [];

    if (allowedTypes.includes('SINGLE_CHOICE')) {
      choiceTypeEnum.push('SINGLE_CHOICE');
    }

    if (allowedTypes.includes('MULTI_CHOICE')) {
      choiceTypeEnum.push('MULTI_CHOICE');
    }

    questionVariants.push({
      ...choiceQuestionSchema,
      properties: {
        ...choiceQuestionSchema.properties,
        type: { type: 'string', enum: choiceTypeEnum },
      },
    });
  }

  if (allowedTypes.includes('SLIDER')) {
    questionVariants.push(sliderQuestionSchema);
  }

  const itemSchema =
    questionVariants.length === 1 ? questionVariants[0] : { oneOf: questionVariants };

  return {
    type: 'object',
    additionalProperties: false,
    required: ['questions'],
    properties: {
      questions: {
        type: 'array',
        minItems: questionCount,
        maxItems: questionCount,
        items: itemSchema,
      },
    },
  };
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
