import { z } from 'zod';

import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from '../prof-orientation-v3-plus/types';

/**
 * What a student may see of an analysis. Every object here is a whitelist: `z.object` drops keys
 * it does not declare, so a field added to the stored `summary` stays admin-only until it is added
 * to a schema in this file on purpose (invariant 6).
 */

const PublicProfessionSchema = z.object({
  code: z.string(),
  title: z.string(),
});

const PublicDirectionResultCardSchema = z.object({
  headline: z.string(),
  meaning: z.string(),
  fitsIf: z.array(z.string()),
  tryActions: z.array(z.string()),
  learn: z.array(z.string()),
  miniProject: z.string(),
});

export const PublicProfOrientationDirectionSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    // The result screen shows the score of the leading directions, so it is public.
    score: z.number(),
    professions: z.array(PublicProfessionSchema),
    resultCard: PublicDirectionResultCardSchema,
  })
  .meta({ id: 'PublicProfOrientationDirection' });

export const PublicAnalysisLlmStatusSchema = z
  .enum(['not_requested', 'pending', 'ready', 'failed'])
  .describe('Статус асинхронного LLM-обогащения для двухфазного анализа');

export const PublicProfOrientationEnrichmentSchema = z
  .object({
    professorSummary: z.string().nullable(),
    summary: z.string(),
    firstSteps: z.array(z.string()),
    learningPlan: z.array(z.string()),
    professionNotes: z.array(z.string()),
    nextMiniProject: z.string(),
  })
  .meta({ id: 'PublicProfOrientationEnrichment' });

export const PublicAtlasProfessionSchema = z
  .object({
    source: z.enum(['primary', 'secondary']),
    requestedTitle: z.string(),
    title: z.string(),
    slug: z.string(),
    url: z.string(),
    summary: z.string().nullable(),
    demandLevel: z.string().nullable(),
    industry: z.string().nullable(),
    municipality: z.string().nullable(),
    skills: z.array(z.string()),
  })
  .meta({ id: 'PublicAtlasProfession' });

export const PublicAtlasRecommendationSchema = z
  .object({
    title: z.string(),
    slug: z.string(),
    url: z.string(),
    summary: z.string().nullable(),
    subtitle: z.string().nullable(),
  })
  .meta({ id: 'PublicAtlasRecommendation' });

export const PublicProfOrientationAtlasSchema = z
  .object({
    status: z.enum(['ready', 'partial', 'unavailable']),
    professions: z.array(PublicAtlasProfessionSchema),
    enterprises: z.array(PublicAtlasRecommendationSchema),
    events: z.array(PublicAtlasRecommendationSchema),
    institutions: z.array(PublicAtlasRecommendationSchema),
  })
  .meta({ id: 'PublicProfOrientationAtlas' });

export const PublicProfOrientationSummarySchema = z
  .object({
    resultKind: z.literal(PROF_ORIENTATION_V3_PLUS_RESULT_KIND),
    profile: z.object({
      type: z.string(),
      title: z.string(),
      meaning: z.string(),
      miniProject: z.string().nullable(),
    }),
    primaryDirection: PublicProfOrientationDirectionSchema.nullable(),
    topDirections: z.array(PublicProfOrientationDirectionSchema),
    confidence: z.object({ label: z.string() }),
    llm: z.object({
      status: PublicAnalysisLlmStatusSchema,
      analysis: PublicProfOrientationEnrichmentSchema.nullable(),
    }),
    atlas: PublicProfOrientationAtlasSchema.nullable(),
  })
  .meta({ id: 'PublicProfOrientationSummary' });

const PublicSkillItemSchema = z.object({
  name: z.string(),
  level: z.enum(['low', 'medium', 'high']),
  score: z.number().nullable(),
  description: z.string(),
});

export const PublicAiAnalysisSummarySchema = z
  .object({
    resultKind: z.literal('ai_analysis'),
    introduction: z.string(),
    skillsLevel: z.object({
      title: z.string(),
      summary: z.string(),
      items: z.array(PublicSkillItemSchema),
    }),
    thinkingType: z.object({
      title: z.string(),
      type: z.string(),
      description: z.string(),
      strengths: z.array(z.string()),
    }),
    personalityTraits: z.object({
      title: z.string(),
      traits: z.array(
        z.object({
          name: z.string(),
          description: z.string(),
          careerImpact: z.string(),
        }),
      ),
    }),
    careerDevelopment: z.object({
      summary: z.string(),
      recommendedDirections: z.array(z.string()),
      developmentRecommendations: z.array(z.string()),
      professionalNextSteps: z.array(z.string()),
    }),
  })
  .meta({ id: 'PublicAiAnalysisSummary' });

/** No result to show: a stub, an analysis still running or failed, or a summary of an unknown shape. */
export const PublicNoAnalysisSummarySchema = z
  .object({
    resultKind: z.literal('none'),
  })
  .meta({ id: 'PublicNoAnalysisSummary' });

export const PublicAnalysisSummarySchema = z
  .discriminatedUnion('resultKind', [
    PublicProfOrientationSummarySchema,
    PublicAiAnalysisSummarySchema,
    PublicNoAnalysisSummarySchema,
  ])
  .meta({ discriminator: { propertyName: 'resultKind' } });

export type PublicProfOrientationSummary = z.infer<typeof PublicProfOrientationSummarySchema>;
export type PublicAiAnalysisSummary = z.infer<typeof PublicAiAnalysisSummarySchema>;
export type PublicAnalysisSummary = z.infer<typeof PublicAnalysisSummarySchema>;
