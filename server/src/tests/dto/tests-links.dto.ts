import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  EntryProfileModeSchema,
  PersonalDataProcessingModeSchema,
  PublicBrandingConfigSchema,
  PublicTemplateSchema,
  PublicSessionAnalysisProviderModeSchema,
  PublicSessionAnalysisStatusSchema,
  PublicSessionStatusSchema,
  PublicStudentEducationLevelSchema,
  PublicStudentGenderSchema,
} from './tests-public.dto';

const GroupOrClassValidationModeSchema = z.enum(['NONE', 'HINT', 'STRICT']);

const HttpUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((value) => /^https?:\/\//i.test(value), {
    message: 'URL must use http or https',
  });

const isRegexPatternValid = (pattern: string) => {
  try {
    // `u` stabilizes behavior for Cyrillic/Unicode group names.
    new RegExp(pattern, 'u');
    return true;
  } catch {
    return false;
  }
};

export const AdminCreatePublicLinkSchema = z
  .object({
    publishedVersionId: z.number().int().min(1),
    shortCode: z.string().trim().min(4).max(32).optional(),
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    entryProfileMode: EntryProfileModeSchema.optional(),
    publicTemplate: PublicTemplateSchema.default('STANDARD'),
    publicBranding: PublicBrandingConfigSchema.nullable().optional(),
    maxAttemptsPerStudent: z.number().int().min(1).max(20).optional(),
    timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
    allowResume: z.boolean().optional(),
    educationOrganizationId: z.number().int().min(1).nullable().optional(),
    personalDataProcessingMode: PersonalDataProcessingModeSchema.default('PUBLIC'),
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
  )
  .refine(
    (value) =>
      value.personalDataProcessingMode !== 'ON_BEHALF_OF_EDUCATION_ORGANIZATION' ||
      value.educationOrganizationId != null,
    {
      message: 'educationOrganizationId is required for organization processing',
      path: ['educationOrganizationId'],
    },
  );

export const AdminUpdatePublicLinkSchema = z
  .object({
    isActive: z.boolean().optional(),
    startsAt: z.string().datetime().nullable().optional(),
    endsAt: z.string().datetime().nullable().optional(),
    entryProfileMode: EntryProfileModeSchema.optional(),
    publicBranding: PublicBrandingConfigSchema.nullable().optional(),
    maxAttemptsPerStudent: z.number().int().min(1).max(20).optional(),
    timeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
    allowResume: z.boolean().optional(),
    educationOrganizationId: z.number().int().min(1).nullable().optional(),
    personalDataProcessingMode: PersonalDataProcessingModeSchema.optional(),
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
  )
  .refine(
    (value) =>
      value.personalDataProcessingMode !== 'ON_BEHALF_OF_EDUCATION_ORGANIZATION' ||
      value.educationOrganizationId != null,
    {
      message: 'educationOrganizationId is required for organization processing',
      path: ['educationOrganizationId'],
    },
  );

export const AdminPublicLinkSchema = z.object({
  id: z.number(),
  publishedVersionId: z.number(),
  topicId: z.number(),
  educationOrganizationId: z.number().nullable(),
  educationOrganizationName: z.string().nullable(),
  personalDataProcessingMode: PersonalDataProcessingModeSchema,
  operatorFullNameSnapshot: z.string().nullable(),
  operatorShortNameSnapshot: z.string().nullable(),
  operatorPrivacyPolicyUrlSnapshot: z.string().nullable(),
  operatorConsentDocumentUrlSnapshot: z.string().nullable(),
  entryProfileMode: EntryProfileModeSchema,
  publicTemplate: PublicTemplateSchema,
  publicBranding: PublicBrandingConfigSchema.nullable(),
  shortCode: z.string(),
  shortUrl: z.string(),
  isActive: z.boolean(),
  archivedAt: z.string().nullable(),
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

export const AdminCreateEducationOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(300),
    fullName: z.string().trim().min(1).max(500).nullable().optional(),
    shortName: z.string().trim().min(1).max(300).nullable().optional(),
    inn: z.string().trim().min(1).max(20).nullable().optional(),
    ogrn: z.string().trim().min(1).max(20).nullable().optional(),
    legalAddress: z.string().trim().min(1).max(500).nullable().optional(),
    email: z.string().trim().min(1).max(320).nullable().optional(),
    phone: z.string().trim().min(1).max(50).nullable().optional(),
    privacyPolicyUrl: HttpUrlSchema.nullable().optional(),
    consentDocumentUrl: HttpUrlSchema.nullable().optional(),
    logoUrl: HttpUrlSchema.nullable().optional(),
    groupValidationMode: GroupOrClassValidationModeSchema.optional(),
    groupValidationPattern: z.string().trim().min(1).max(300).nullable().optional(),
    groupValidationExample: z.string().trim().min(1).max(120).nullable().optional(),
    groupValidationHint: z.string().trim().min(1).max(300).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const mode = value.groupValidationMode ?? 'NONE';
    const pattern = value.groupValidationPattern?.trim();

    if (mode !== 'NONE' && !pattern) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['groupValidationPattern'],
        message: 'Укажите регулярное выражение для проверки группы/класса',
      });
    }

    if (pattern && !isRegexPatternValid(pattern)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['groupValidationPattern'],
        message: 'Некорректное регулярное выражение формата группы/класса',
      });
    }
  });

export const AdminUpdateEducationOrganizationSchema = z
  .object({
    name: z.string().trim().min(2).max(300).optional(),
    fullName: z.string().trim().min(1).max(500).nullable().optional(),
    shortName: z.string().trim().min(1).max(300).nullable().optional(),
    inn: z.string().trim().min(1).max(20).nullable().optional(),
    ogrn: z.string().trim().min(1).max(20).nullable().optional(),
    legalAddress: z.string().trim().min(1).max(500).nullable().optional(),
    email: z.string().trim().min(1).max(320).nullable().optional(),
    phone: z.string().trim().min(1).max(50).nullable().optional(),
    privacyPolicyUrl: HttpUrlSchema.nullable().optional(),
    consentDocumentUrl: HttpUrlSchema.nullable().optional(),
    logoUrl: HttpUrlSchema.nullable().optional(),
    isActive: z.boolean().optional(),
    groupValidationMode: GroupOrClassValidationModeSchema.optional(),
    groupValidationPattern: z.string().trim().min(1).max(300).nullable().optional(),
    groupValidationExample: z.string().trim().min(1).max(120).nullable().optional(),
    groupValidationHint: z.string().trim().min(1).max(300).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    const pattern = value.groupValidationPattern?.trim();

    if (pattern && !isRegexPatternValid(pattern)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['groupValidationPattern'],
        message: 'Некорректное регулярное выражение формата группы/класса',
      });
    }
  });

export const AdminEducationOrganizationSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string().nullable(),
  shortName: z.string().nullable(),
  inn: z.string().nullable(),
  ogrn: z.string().nullable(),
  legalAddress: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  privacyPolicyUrl: HttpUrlSchema.nullable(),
  consentDocumentUrl: HttpUrlSchema.nullable(),
  logoUrl: HttpUrlSchema.nullable(),
  personalDataReady: z.boolean(),
  isActive: z.boolean(),
  groupValidationMode: GroupOrClassValidationModeSchema,
  groupValidationPattern: z.string().nullable(),
  groupValidationExample: z.string().nullable(),
  groupValidationHint: z.string().nullable(),
  linksCount: z.number().int().min(0),
  activeLinksCount: z.number().int().min(0),
  attemptsCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AdminEducationOrganizationsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const AdminEducationOrganizationsListResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
  organizations: z.array(AdminEducationOrganizationSchema),
});

export const AdminPublicLinksListResponseSchema = z.object({
  links: z.array(AdminPublicLinkSchema),
});

export const AdminDeletePublicLinkResponseSchema = z.object({
  linkId: z.number(),
});

export const AdminPublicAttemptSummarySchema = z.object({
  attemptId: z.number(),
  attemptNumber: z.number().int().min(1),
  status: PublicSessionStatusSchema,
  entryProfileMode: EntryProfileModeSchema,
  studentName: z.string().nullable(),
  studentLastInitial: z.string().nullable(),
  studentMiddleInitial: z.string().nullable(),
  educationOrganization: z.string().nullable(),
  groupOrClass: z.string().nullable(),
  studentGender: PublicStudentGenderSchema.nullable(),
  studentAge: z.number().int().nullable(),
  studentResidence: z.string().nullable(),
  studentEducationLevel: PublicStudentEducationLevelSchema.nullable(),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  analysisStatus: PublicSessionAnalysisStatusSchema.nullable(),
});

export const AdminPublicAttemptsListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const AdminPublicAttemptsListResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(1),
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
  professionAtlasUrl: z.string().url().nullable(),
  attemptNumber: z.number().int().min(1),
  status: PublicSessionStatusSchema,
  entryProfileMode: EntryProfileModeSchema,
  studentName: z.string().nullable(),
  studentLastInitial: z.string().nullable(),
  studentMiddleInitial: z.string().nullable(),
  educationOrganization: z.string().nullable(),
  groupOrClass: z.string().nullable(),
  studentGender: PublicStudentGenderSchema.nullable(),
  studentAge: z.number().int().nullable(),
  studentResidence: z.string().nullable(),
  studentEducationLevel: PublicStudentEducationLevelSchema.nullable(),
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
export class AdminDeletePublicLinkResponseDto extends createZodDto(
  AdminDeletePublicLinkResponseSchema,
) {}
export class AdminPublicAttemptsListQueryDto extends createZodDto(
  AdminPublicAttemptsListQuerySchema,
) {}
export class AdminPublicAttemptsListResponseDto extends createZodDto(
  AdminPublicAttemptsListResponseSchema,
) {}
export class AdminPublicAttemptDetailResponseDto extends createZodDto(
  AdminPublicAttemptDetailResponseSchema,
) {}
export class AdminCreateEducationOrganizationDto extends createZodDto(
  AdminCreateEducationOrganizationSchema,
) {}
export class AdminUpdateEducationOrganizationDto extends createZodDto(
  AdminUpdateEducationOrganizationSchema,
) {}
export class AdminEducationOrganizationsListQueryDto extends createZodDto(
  AdminEducationOrganizationsListQuerySchema,
) {}
export class AdminEducationOrganizationsListResponseDto extends createZodDto(
  AdminEducationOrganizationsListResponseSchema,
) {}
export class AdminEducationOrganizationDto extends createZodDto(AdminEducationOrganizationSchema) {}
