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

export const PublicStudentProfileSchema = z.object({
  studentName: z.string().trim().min(1).max(200),
  studentLastInitial: z.string().trim().min(1).max(1),
  studentMiddleInitial: z.string().trim().min(1).max(1),
  educationOrganization: z.string().trim().min(1).max(300),
  groupOrClass: z.string().trim().min(1).max(120),
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

export const PublicLinkAccessResponseSchema = z.object({
  shortCode: z.string(),
  title: z.string(),
  description: z.string().nullable(),
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
  status: PublicSessionStatusSchema,
  finishedAt: z.string().nullable(),
  analysis: PublicSessionAnalysisSchema,
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
