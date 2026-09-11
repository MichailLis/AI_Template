import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

import {
  PublicAnalysisLlmStatusSchema,
  PublicSessionAnalysisStatusSchema,
  PublicSessionStatusSchema,
} from './tests-public.dto';

const ShareSchema = z.number().min(0).max(100);

const LabelAndCountSchema = z.object({
  label: z.string().trim().min(1),
  count: z.number().int().min(0),
  share: ShareSchema,
});

export const AdminTestAnalyticsQuerySchema = z
  .object({
    scope: z.enum(['TOPIC', 'PUBLIC_LINK']).default('TOPIC'),
    publicLinkId: z.coerce.number().int().min(1).optional(),
    linkStatus: z.enum(['ALL', 'ACTIVE', 'ARCHIVED']).default('ALL'),
    dateFrom: z.string().date().optional(),
    dateTo: z.string().date().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.scope === 'PUBLIC_LINK' && value.publicLinkId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['publicLinkId'],
        message: 'publicLinkId is required when scope is PUBLIC_LINK',
      });
    }

    if (value.dateFrom && value.dateTo && value.dateTo < value.dateFrom) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['dateTo'],
        message: 'dateTo must not be earlier than dateFrom',
      });
    }
  });

export const AdminTestAnalyticsTopicSectionSchema = z.object({
  topicId: z.number().int().min(1),
  slug: z.string().trim().min(1),
  title: z.string().trim().min(1),
  questionCount: z.number().int().min(0),
  generatedAt: z.string(),
});

export const AdminTestAnalyticsFiltersSectionSchema = z.object({
  scope: z.enum(['TOPIC', 'PUBLIC_LINK']),
  publicLinkId: z.number().int().min(1).nullable(),
  linkStatus: z.enum(['ALL', 'ACTIVE', 'ARCHIVED']),
  dateFrom: z.string().date().nullable(),
  dateTo: z.string().date().nullable(),
});

export const AdminTestAnalyticsCoverageSectionSchema = z.object({
  publicLinks: z.number().int().min(0),
  attemptsTotal: z.number().int().min(0),
  attemptsCompleted: z.number().int().min(0),
  analysisReady: z.number().int().min(0),
  analysisPending: z.number().int().min(0),
  analysisFailed: z.number().int().min(0),
  analysisMissing: z.number().int().min(0),
  v3Results: z.number().int().min(0),
});

export const AdminTestAnalyticsDirectionItemSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  count: z.number().int().min(0),
  share: ShareSchema,
});

export const AdminTestAnalyticsDirectionPairItemSchema = z.object({
  primaryDirectionId: z.string().trim().min(1),
  secondaryDirectionId: z.string().trim().min(1),
  label: z.string().trim().min(1),
  count: z.number().int().min(0),
  share: ShareSchema,
});

export const AdminTestAnalyticsScoreAverageItemSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1),
  average: z.number().min(0).max(100),
});

export const AdminTestAnalyticsProfilesSchema = z.array(
  z.object({
    profileType: z.string().trim().min(1),
    label: z.string().trim().min(1),
    count: z.number().int().min(0),
    share: ShareSchema,
  }),
);

export const AdminTestAnalyticsConfidenceSchema = z.object({
  levels: LabelAndCountSchema.array(),
  gap: z.object({
    value: z.number().min(0).max(100),
    total: z.number().int().min(0),
  }),
  consistencyIndex: z.object({
    value: z.number().min(0).max(100),
    total: z.number().int().min(0),
  }),
  readinessTop: z.object({
    value: z.number().min(0).max(100),
    total: z.number().int().min(0),
  }),
});

export const AdminTestAnalyticsFlagsSchema = z.array(
  z.object({
    flag: z.string().trim().min(1),
    label: z.string().trim().min(1),
    count: z.number().int().min(0),
    share: ShareSchema,
  }),
);

export const AdminTestAnalyticsPublicLinkSectionSchema = z.array(
  z.object({
    publicLinkId: z.number().int().min(1),
    shortCode: z.string().trim().min(1),
    title: z.string().trim().min(1),
    archivedAt: z.string().nullable(),
    attemptsTotal: z.number().int().min(0),
    attemptsCompleted: z.number().int().min(0),
    analysisReady: z.number().int().min(0),
    share: ShareSchema,
  }),
);

export const AdminTestAnalyticsGroupsSchema = z.array(
  z.object({
    educationOrganization: z.string().nullable(),
    groupOrClass: z.string().nullable(),
    attemptsTotal: z.number().int().min(0),
    attemptsCompleted: z.number().int().min(0),
    share: ShareSchema,
  }),
);

export const AdminTestAnalyticsDemographicsSchema = z.object({
  gender: LabelAndCountSchema.array(),
  ageRange: LabelAndCountSchema.array(),
  residence: LabelAndCountSchema.array(),
  educationLevel: LabelAndCountSchema.array(),
});

export const AdminTestAnalyticsAttemptRowSchema = z.object({
  attemptId: z.number().int().min(1),
  publicLinkId: z.number().int().min(1),
  shortCode: z.string().trim().min(1),
  startedAt: z.string(),
  finishedAt: z.string().nullable(),
  status: PublicSessionStatusSchema,
  analysisStatus: PublicSessionAnalysisStatusSchema.nullable().describe(
    'Статус алгоритмической записи анализа (не является признаком завершения LLM-обогащения)',
  ),
  llmStatus: PublicAnalysisLlmStatusSchema.nullable().describe(
    'Статус асинхронного LLM-обогащения для двухфазного анализа',
  ),
});

export const AdminTestAnalyticsSummarySchema = z.object({
  topic: AdminTestAnalyticsTopicSectionSchema,
  filters: AdminTestAnalyticsFiltersSectionSchema,
  coverage: AdminTestAnalyticsCoverageSectionSchema,
  directions: z.array(AdminTestAnalyticsDirectionItemSchema),
  directionPairs: z.array(AdminTestAnalyticsDirectionPairItemSchema),
  scoreAverages: z.array(AdminTestAnalyticsScoreAverageItemSchema),
  profiles: AdminTestAnalyticsProfilesSchema,
  confidence: AdminTestAnalyticsConfidenceSchema,
  flags: AdminTestAnalyticsFlagsSchema,
  publicLinks: AdminTestAnalyticsPublicLinkSectionSchema,
  groups: AdminTestAnalyticsGroupsSchema,
  demographics: AdminTestAnalyticsDemographicsSchema,
  attempts: z.array(AdminTestAnalyticsAttemptRowSchema),
});

export class AdminTestAnalyticsQueryDto extends createZodDto(AdminTestAnalyticsQuerySchema) {}
export class AdminTestAnalyticsSummaryDto extends createZodDto(AdminTestAnalyticsSummarySchema) {}
