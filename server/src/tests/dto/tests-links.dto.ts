import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  PublicSessionAnalysisProviderModeSchema,
  PublicSessionAnalysisStatusSchema,
  PublicSessionStatusSchema,
} from './tests-public.dto';

export const AdminCreatePublicLinkSchema = z
  .object({
    publishedVersionId: z.number().int().min(1),
    shortCode: z.string().trim().min(4).max(32).optional(),
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    maxAttemptsPerStudent: z.number().int().min(1).max(20).optional(),
    timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
    allowResume: z.boolean().optional(),
    consentVersion: z.string().trim().min(1).max(64),
    consentText: z.string().trim().min(1).max(16000),
  })
  .refine(
    (value) => {
      if (!value.startsAt || !value.endsAt) {
        return true;
      }

      return new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime();
    },
    {
      message: 'endsAt must be greater than startsAt',
      path: ['endsAt'],
    },
  );

export const AdminUpdatePublicLinkSchema = z
  .object({
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    maxAttemptsPerStudent: z.number().int().min(1).max(20).optional(),
    timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
    allowResume: z.boolean().optional(),
    consentVersion: z.string().trim().min(1).max(64).optional(),
    consentText: z.string().trim().min(1).max(16000).optional(),
  })
  .refine(
    (value) => {
      if (!value.startsAt || !value.endsAt) {
        return true;
      }

      return new Date(value.endsAt).getTime() > new Date(value.startsAt).getTime();
    },
    {
      message: 'endsAt must be greater than startsAt',
      path: ['endsAt'],
    },
  );

export const AdminPublicLinkSchema = z.object({
  id: z.number(),
  publishedVersionId: z.number(),
  topicId: z.number(),
  shortCode: z.string(),
  shortUrl: z.string(),
  isActive: z.boolean(),
  startsAt: z.string().nullable(),
  endsAt: z.string().nullable(),
  maxAttemptsPerStudent: z.number().int().min(1),
  timeLimitMinutes: z.number().int().min(1).nullable(),
  allowResume: z.boolean(),
  consentVersion: z.string(),
  consentText: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
});

export const AdminPublicLinksListResponseSchema = z.object({
  links: z.array(AdminPublicLinkSchema),
});

export const AdminPublicAttemptSummarySchema = z.object({
  attemptId: z.number(),
  attemptNumber: z.number().int().min(1),
  status: PublicSessionStatusSchema,
  studentName: z.string(),
  studentLastInitial: z.string(),
  studentMiddleInitial: z.string(),
  educationOrganization: z.string(),
  groupOrClass: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  analysisStatus: PublicSessionAnalysisStatusSchema.nullable(),
});

export const AdminPublicAttemptsListResponseSchema = z.object({
  attempts: z.array(AdminPublicAttemptSummarySchema),
});

export const AdminPublicAttemptAnswerSchema = z.object({
  questionId: z.number().int().min(1),
  questionType: z.string(),
  questionTitle: z.string(),
  answerPayload: z.unknown(),
  updatedAt: z.string(),
});

export const AdminPublicAttemptAnalysisSchema = z
  .object({
    providerMode: PublicSessionAnalysisProviderModeSchema,
    status: PublicSessionAnalysisStatusSchema,
    summary: z.unknown().nullable(),
    rawText: z.string().nullable(),
    errorMessage: z.string().nullable(),
    generatedAt: z.string().nullable(),
  })
  .nullable();

export const AdminPublicAttemptDetailResponseSchema = z.object({
  attemptId: z.number(),
  publicLinkId: z.number(),
  shortCode: z.string(),
  attemptNumber: z.number().int().min(1),
  status: PublicSessionStatusSchema,
  studentName: z.string(),
  studentLastInitial: z.string(),
  studentMiddleInitial: z.string(),
  educationOrganization: z.string(),
  groupOrClass: z.string(),
  consentAcceptedAt: z.string(),
  consentVersion: z.string(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  answers: z.array(AdminPublicAttemptAnswerSchema),
  analysis: AdminPublicAttemptAnalysisSchema,
});

export class AdminCreatePublicLinkDto extends createZodDto(AdminCreatePublicLinkSchema) {}
export class AdminUpdatePublicLinkDto extends createZodDto(AdminUpdatePublicLinkSchema) {}
export class AdminPublicLinkDto extends createZodDto(AdminPublicLinkSchema) {}
export class AdminPublicLinksListResponseDto extends createZodDto(
  AdminPublicLinksListResponseSchema,
) {}
export class AdminPublicAttemptsListResponseDto extends createZodDto(
  AdminPublicAttemptsListResponseSchema,
) {}
export class AdminPublicAttemptDetailResponseDto extends createZodDto(
  AdminPublicAttemptDetailResponseSchema,
) {}
