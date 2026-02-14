import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const TestQuestionTypeSchema = z.enum([
  'OPEN_TEXT',
  'SINGLE_CHOICE',
  'MULTI_CHOICE',
  'SLIDER',
]);

export const TestQuestionOptionSchema = z.object({
  id: z.number(),
  label: z.string(),
  value: z.string(),
  weight: z.number(),
  order: z.number(),
});

export const TestQuestionSliderBandSchema = z.object({
  id: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  label: z.string(),
  weight: z.number(),
  order: z.number(),
});

export const TestQuestionSchema = z.object({
  id: z.number(),
  type: TestQuestionTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  order: z.number(),
  settings: z.unknown().nullable(),
  options: z.array(TestQuestionOptionSchema),
  sliderBands: z.array(TestQuestionSliderBandSchema),
});

export const TestsTopicSummarySchema = z.object({
  id: z.number(),
  slug: z.string(),
  draftVersionNumber: z.number(),
  draftTitle: z.string(),
  draftQuestionCount: z.number(),
  publishedVersionNumber: z.number().nullable(),
  publishedTitle: z.string().nullable(),
  updatedAt: z.string(),
});

export const TestsTopicListResponseSchema = z.object({
  topics: z.array(TestsTopicSummarySchema),
});

export const TestsTopicDraftSchema = z.object({
  id: z.number(),
  versionNumber: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  questions: z.array(TestQuestionSchema),
});

export const TestsTopicPublishedSchema = z
  .object({
    id: z.number(),
    versionNumber: z.number(),
    title: z.string(),
  })
  .nullable();

export const TestsTopicDetailResponseSchema = z.object({
  topicId: z.number(),
  slug: z.string(),
  draft: TestsTopicDraftSchema,
  published: TestsTopicPublishedSchema,
});

export const CreateTestsTopicSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const UpdateTestsTopicDraftSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const UpsertTestQuestionOptionSchema = z.object({
  label: z.string().min(1).max(400),
  value: z.string().min(1).max(400),
  weight: z.number().int().min(-1000).max(1000).default(0),
});

export const UpsertTestQuestionSliderBandSchema = z.object({
  minValue: z.number().int(),
  maxValue: z.number().int(),
  label: z.string().min(1).max(400),
  weight: z.number().int().min(-1000).max(1000).default(0),
});

export const UpsertTestsQuestionSchema = z.object({
  type: TestQuestionTypeSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  required: z.boolean().default(true),
  settings: z.unknown().optional(),
  options: z.array(UpsertTestQuestionOptionSchema).optional(),
  sliderBands: z.array(UpsertTestQuestionSliderBandSchema).optional(),
});

export const CreateTestsTopicFromAiSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  questions: z.array(UpsertTestsQuestionSchema).min(1).max(60),
});

export const ReorderTestsQuestionsSchema = z.object({
  questionIds: z.array(z.number().int().min(1)).min(1),
});

export const PublishTestsTopicResponseSchema = z.object({
  topicId: z.number(),
  publishedVersionNumber: z.number(),
  newDraftVersionNumber: z.number(),
});

export const DeleteTestsTopicResponseSchema = z.object({
  topicId: z.number(),
});

export class TestsTopicListResponseDto extends createZodDto(
  TestsTopicListResponseSchema,
) {}
export class TestsTopicDetailResponseDto extends createZodDto(
  TestsTopicDetailResponseSchema,
) {}
export class CreateTestsTopicDto extends createZodDto(CreateTestsTopicSchema) {}
export class UpdateTestsTopicDraftDto extends createZodDto(
  UpdateTestsTopicDraftSchema,
) {}
export class UpsertTestsQuestionDto extends createZodDto(
  UpsertTestsQuestionSchema,
) {}
export class CreateTestsTopicFromAiDto extends createZodDto(
  CreateTestsTopicFromAiSchema,
) {}
export class ReorderTestsQuestionsDto extends createZodDto(
  ReorderTestsQuestionsSchema,
) {}
export class PublishTestsTopicResponseDto extends createZodDto(
  PublishTestsTopicResponseSchema,
) {}
export class DeleteTestsTopicResponseDto extends createZodDto(
  DeleteTestsTopicResponseSchema,
) {}
