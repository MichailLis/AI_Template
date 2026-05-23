import { z } from 'zod';

const NonEmptyStringSchema = z.string().trim().min(1);
export const TestAnalysisSummarySchema = z.object({}).catchall(z.unknown());
const MAX_SKILLS_COUNT = 6;
const MAX_THINKING_STRENGTHS_COUNT = 4;
const MAX_TRAITS_COUNT = 6;
const MAX_RECOMMENDED_DIRECTIONS_COUNT = 6;
const MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT = 6;
const MAX_PROFESSIONAL_NEXT_STEPS_COUNT = 3;

export const TestAnalysisSkillLevelSchema = z.enum(['low', 'medium', 'high']);

export const TestAnalysisSkillItemSchema = z.object({
  name: NonEmptyStringSchema,
  level: TestAnalysisSkillLevelSchema,
  score: z.number().min(0).max(100).nullable().optional(),
  description: NonEmptyStringSchema,
});

export const TestAnalysisResultSchema = z.object({
  introduction: NonEmptyStringSchema,
  skillsLevel: z.object({
    title: NonEmptyStringSchema,
    summary: NonEmptyStringSchema,
    items: z.array(TestAnalysisSkillItemSchema).min(1).max(MAX_SKILLS_COUNT),
  }),
  thinkingType: z.object({
    title: NonEmptyStringSchema,
    type: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    strengths: z.array(NonEmptyStringSchema).min(1).max(MAX_THINKING_STRENGTHS_COUNT),
  }),
  personalityTraits: z.object({
    title: NonEmptyStringSchema,
    traits: z
      .array(
        z.object({
          name: NonEmptyStringSchema,
          description: NonEmptyStringSchema,
          careerImpact: NonEmptyStringSchema,
        }),
      )
      .min(1)
      .max(MAX_TRAITS_COUNT),
  }),
  careerDevelopment: z.object({
    summary: NonEmptyStringSchema,
    recommendedDirections: z
      .array(NonEmptyStringSchema)
      .min(1)
      .max(MAX_RECOMMENDED_DIRECTIONS_COUNT),
    developmentRecommendations: z
      .array(NonEmptyStringSchema)
      .min(1)
      .max(MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT),
    professionalNextSteps: z
      .array(NonEmptyStringSchema)
      .min(1)
      .max(MAX_PROFESSIONAL_NEXT_STEPS_COUNT),
  }),
});

const stringProperty = {
  type: 'string',
  minLength: 1,
} as const;

const stringArrayProperty = (maxItems: number) =>
  ({
    type: 'array',
    minItems: 1,
    maxItems,
    items: stringProperty,
  }) as const;

export const TestAnalysisResultJsonSchema = {
  name: 'student_test_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'introduction',
      'skillsLevel',
      'thinkingType',
      'personalityTraits',
      'careerDevelopment',
    ],
    properties: {
      introduction: stringProperty,
      skillsLevel: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'summary', 'items'],
        properties: {
          title: stringProperty,
          summary: stringProperty,
          items: {
            type: 'array',
            minItems: 1,
            maxItems: MAX_SKILLS_COUNT,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'level', 'description'],
              properties: {
                name: stringProperty,
                level: {
                  type: 'string',
                  enum: ['low', 'medium', 'high'],
                },
                score: {
                  type: ['number', 'null'],
                  minimum: 0,
                  maximum: 100,
                },
                description: stringProperty,
              },
            },
          },
        },
      },
      thinkingType: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'type', 'description', 'strengths'],
        properties: {
          title: stringProperty,
          type: stringProperty,
          description: stringProperty,
          strengths: stringArrayProperty(MAX_THINKING_STRENGTHS_COUNT),
        },
      },
      personalityTraits: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'traits'],
        properties: {
          title: stringProperty,
          traits: {
            type: 'array',
            minItems: 1,
            maxItems: MAX_TRAITS_COUNT,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'description', 'careerImpact'],
              properties: {
                name: stringProperty,
                description: stringProperty,
                careerImpact: stringProperty,
              },
            },
          },
        },
      },
      careerDevelopment: {
        type: 'object',
        additionalProperties: false,
        required: [
          'summary',
          'recommendedDirections',
          'developmentRecommendations',
          'professionalNextSteps',
        ],
        properties: {
          summary: stringProperty,
          recommendedDirections: stringArrayProperty(MAX_RECOMMENDED_DIRECTIONS_COUNT),
          developmentRecommendations: stringArrayProperty(MAX_DEVELOPMENT_RECOMMENDATIONS_COUNT),
          professionalNextSteps: stringArrayProperty(MAX_PROFESSIONAL_NEXT_STEPS_COUNT),
        },
      },
    },
  },
} as const;
