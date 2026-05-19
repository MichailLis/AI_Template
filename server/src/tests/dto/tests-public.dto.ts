import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import { TestQuestionTypeSchema } from './tests.dto';

export const PublicQuestionOptionSchema = z.object({
  id: z.number(),
  label: z.string(),
  value: z.string(),
  order: z.number(),
});

export const PublicQuestionSliderBandSchema = z.object({
  id: z.number(),
  minValue: z.number(),
  maxValue: z.number(),
  label: z.string(),
  order: z.number(),
});

export const EntryProfileModeSchema = z.enum(['DEMOGRAPHIC', 'EDUCATION', 'EDUCATION_DEMOGRAPHIC']);

export const PublicTemplateSchema = z.enum(['STANDARD', 'POLUS']);

export const PublicStudentGenderSchema = z.enum(['MALE', 'FEMALE']);

export const PublicStudentEducationLevelSchema = z.enum([
  'BASIC_GENERAL',
  'SECONDARY_GENERAL',
  'SECONDARY_SPECIAL',
  'INCOMPLETE_HIGHER_FROM_YEAR_3',
  'HIGHER',
]);

export const PublicStudentProfileSchema = z.object({
  entryProfileMode: EntryProfileModeSchema.optional(),
  studentName: z.string().trim().min(1).max(200).optional(),
  studentLastInitial: z.string().trim().min(1).max(1).optional(),
  studentMiddleInitial: z.string().trim().min(1).max(1).optional(),
  educationOrganization: z.string().trim().min(1).max(300).optional(),
  groupOrClass: z.string().trim().min(1).max(120).optional(),
  gender: PublicStudentGenderSchema.optional(),
  age: z.number().int().min(1).max(120).optional(),
  residence: z.string().trim().min(1).max(300).optional(),
  educationLevel: PublicStudentEducationLevelSchema.optional(),
  consentAccepted: z.literal(true),
});

export const PublicTestQuestionSchema = z.object({
  id: z.number(),
  type: TestQuestionTypeSchema,
  title: z.string(),
  description: z.string().nullable(),
  required: z.boolean(),
  order: z.number(),
  settings: z.unknown().nullable(),
  options: z.array(PublicQuestionOptionSchema),
  sliderBands: z.array(PublicQuestionSliderBandSchema),
});

export const PublicSessionAnswerSchema = z.object({
  questionId: z.number().int().min(1),
  answerPayload: z.unknown(),
  updatedAt: z.string(),
});

export const PublicSessionStatusSchema = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'EXPIRED',
  'ABANDONED',
]);

export const PublicGroupValidationModeSchema = z.enum(['NONE', 'HINT', 'STRICT']);

export const PublicLinkAccessResponseSchema = z.object({
  shortCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  entryProfileMode: EntryProfileModeSchema,
  publicTemplate: PublicTemplateSchema,
  educationOrganization: z.string().nullable(),
  groupValidationMode: PublicGroupValidationModeSchema,
  groupValidationPattern: z.string().nullable(),
  groupValidationExample: z.string().nullable(),
  groupValidationHint: z.string().nullable(),
  questionCount: z.number().int().min(0),
  maxAttemptsPerStudent: z.number().int().min(1),
  timeLimitMinutes: z.number().int().min(1).nullable(),
  allowResume: z.boolean(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  consentVersion: z.string(),
  consentText: z.string(),
});

export const PublicSessionStateSchema = z.object({
  sessionToken: z.string(),
  shortCode: z.string(),
  publicTemplate: PublicTemplateSchema,
  attemptNumber: z.number().int().min(1),
  status: PublicSessionStatusSchema,
  startedAt: z.string(),
  expiresAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  timeLimitMinutes: z.number().int().min(1).nullable(),
  questions: z.array(PublicTestQuestionSchema),
  answers: z.array(PublicSessionAnswerSchema),
});

export const PublicSessionStartRequestSchema = PublicStudentProfileSchema;

export const PublicSessionStartResponseSchema = z.object({
  session: PublicSessionStateSchema,
});

export const PublicSessionGetResponseSchema = z.object({
  session: PublicSessionStateSchema,
});

export const PublicSessionSaveAnswerItemSchema = z.object({
  questionId: z.number().int().min(1),
  answerPayload: z.unknown(),
});

export const PublicSessionSaveAnswersRequestSchema = z.object({
  answers: z.array(PublicSessionSaveAnswerItemSchema).min(1),
});

export const PublicSessionSaveAnswersResponseSchema = z.object({
  sessionToken: z.string(),
  status: PublicSessionStatusSchema,
  answers: z.array(PublicSessionAnswerSchema),
});

export const PublicSessionAnalysisStatusSchema = z.enum(['PENDING', 'READY', 'FAILED']);
export const PublicSessionAnalysisProviderModeSchema = z.enum(['STUB', 'LLM']);

export const PublicSessionAnalysisSchema = z.object({
  providerMode: PublicSessionAnalysisProviderModeSchema,
  status: PublicSessionAnalysisStatusSchema,
  summary: z.unknown().nullable(),
  rawText: z.string().nullable(),
  errorMessage: z.string().nullable(),
  generatedAt: z.string().nullable(),
});

export const PublicSessionFinishResponseSchema = z.object({
  sessionToken: z.string(),
  status: PublicSessionStatusSchema,
  finishedAt: z.string().nullable(),
  analysis: PublicSessionAnalysisSchema,
});

export const PublicSessionResultResponseSchema = z.object({
  sessionToken: z.string(),
  publicTemplate: PublicTemplateSchema,
  status: PublicSessionStatusSchema,
  finishedAt: z.string().nullable(),
  analysis: PublicSessionAnalysisSchema,
  professionAtlasUrl: z.string().url().nullable(),
});

export class PublicLinkAccessResponseDto extends createZodDto(PublicLinkAccessResponseSchema) {}
export class PublicSessionStartRequestDto extends createZodDto(PublicSessionStartRequestSchema) {}
export class PublicSessionStartResponseDto extends createZodDto(PublicSessionStartResponseSchema) {}
export class PublicSessionGetResponseDto extends createZodDto(PublicSessionGetResponseSchema) {}
export class PublicSessionSaveAnswersRequestDto extends createZodDto(
  PublicSessionSaveAnswersRequestSchema,
) {}
export class PublicSessionSaveAnswersResponseDto extends createZodDto(
  PublicSessionSaveAnswersResponseSchema,
) {}
export class PublicSessionFinishResponseDto extends createZodDto(
  PublicSessionFinishResponseSchema,
) {}
export class PublicSessionResultResponseDto extends createZodDto(
  PublicSessionResultResponseSchema,
) {}
