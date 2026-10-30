import type { CreateTestsTopicFromAiDtoQuestionsItemType } from '@/shared/api/model';

interface BuildAiQuestionJsonSchemaParams {
  questionCount: number;
  allowedTypes: Array<CreateTestsTopicFromAiDtoQuestionsItemType>;
}

const nullableDescriptionSchema = {
  anyOf: [{ type: 'string', maxLength: 2000 }, { type: 'null' }],
};

const baseQuestionProperties = {
  title: { type: 'string', minLength: 1, maxLength: 200 },
  description: nullableDescriptionSchema,
  required: { type: 'boolean' },
};

const openTextQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'title', 'required'],
  properties: {
    ...baseQuestionProperties,
    type: { type: 'string', enum: ['OPEN_TEXT'] },
  },
};

const choiceQuestionSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['type', 'title', 'required', 'options'],
  properties: {
    ...baseQuestionProperties,
    type: { type: 'string', enum: ['SINGLE_CHOICE', 'MULTI_CHOICE'] },
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
    ...baseQuestionProperties,
    type: { type: 'string', enum: ['SLIDER'] },
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

export const buildAiQuestionJsonSchema = ({
  questionCount,
  allowedTypes,
}: BuildAiQuestionJsonSchemaParams): Record<string, unknown> => {
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
