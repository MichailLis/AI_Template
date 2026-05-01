import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const NonEmptyStringSchema = z.string().trim().min(1);

export const TestAnalysisSkillLevelSchema = z.enum(['low', 'medium', 'high']);

export const TestAnalysisSkillItemSchema = z.object({
  name: NonEmptyStringSchema,
  level: TestAnalysisSkillLevelSchema,
  score: z.number().min(0).max(100).nullable().optional(),
  description: NonEmptyStringSchema,
});

export const TestAnalysisResultSchema = z.object({
  skillsLevel: z.object({
    title: NonEmptyStringSchema,
    summary: NonEmptyStringSchema,
    items: z.array(TestAnalysisSkillItemSchema).min(1),
  }),
  thinkingType: z.object({
    title: NonEmptyStringSchema,
    type: NonEmptyStringSchema,
    description: NonEmptyStringSchema,
    strengths: z.array(NonEmptyStringSchema).min(1),
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
      .min(1),
  }),
  careerDevelopment: z.object({
    summary: NonEmptyStringSchema,
    recommendedDirections: z.array(NonEmptyStringSchema).min(1),
    developmentRecommendations: z.array(NonEmptyStringSchema).min(1),
    professionalNextSteps: z.array(NonEmptyStringSchema).min(1),
  }),
});

const stringProperty = {
  type: 'string',
  minLength: 1,
} as const;

const stringArrayProperty = {
  type: 'array',
  minItems: 1,
  items: stringProperty,
} as const;

export const TestAnalysisResultJsonSchema = {
  name: 'student_test_analysis',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['skillsLevel', 'thinkingType', 'personalityTraits', 'careerDevelopment'],
    properties: {
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
          strengths: stringArrayProperty,
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
          recommendedDirections: stringArrayProperty,
          developmentRecommendations: stringArrayProperty,
          professionalNextSteps: stringArrayProperty,
        },
      },
    },
  },
} as const;

export class TestAnalysisResultDto extends createZodDto(TestAnalysisResultSchema) {}
