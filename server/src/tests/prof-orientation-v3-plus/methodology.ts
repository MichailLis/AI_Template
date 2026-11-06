import type { ScoringMethodology } from '../methodology/scoring-methodology';
import { buildV3AnalyticsSections, getV3Summary } from './analytics';
import { shouldRefreshProfOrientationAtlasSummary } from './atlas.logic';
import {
  ProfOrientationV3PlusEnrichmentJsonSchema,
  parseProfOrientationV3PlusEnrichment,
} from './enrichment';
import { buildProfOrientationEnrichmentPrompt } from './enrichment-prompt';
import {
  PROF_ORIENTATION_V3_PLUS_CONFIG,
  PROF_ORIENTATION_V3_PLUS_PROMPT,
  PROF_ORIENTATION_V3_PLUS_PROMPT_MODEL,
  PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE,
  PROF_ORIENTATION_V3_PLUS_SLUG,
  PROF_ORIENTATION_V3_PLUS_TITLE,
  buildProfOrientationV3PlusQuestionPayloads,
  toProfOrientationScoringConfig,
} from './fixture';
import { toPublicProfOrientationSummary } from './public-summary';
import {
  getProfOrientationLlmStatus,
  isProfOrientationV3PlusSummary,
  resolveProfOrientationV3PlusConfig,
  scoreProfOrientationV3Plus,
} from './scoring';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from './types';

const PROF_ORIENTATION_AI_TIMEOUT_MS = 90_000;
const PROF_ORIENTATION_TIMEOUT_RETRIES = 2;
const PROF_ORIENTATION_MAX_TIMEOUT_RETRIES = 2;

export const profOrientationV3PlusMethodology: ScoringMethodology = {
  kind: 'PROF_ORIENTATION_V3_PLUS',
  resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
  isSummary: isProfOrientationV3PlusSummary,
  llmStatus: getProfOrientationLlmStatus,
  score: ({ attempt, llmRequested }) =>
    scoreProfOrientationV3Plus({
      questions: attempt.topicVersion.questions,
      answers: attempt.answers,
      config: resolveProfOrientationV3PlusConfig(attempt.topicVersion.scoringConfig),
      llmStatus: llmRequested ? 'pending' : 'not_requested',
    }),
  enrichment: {
    purpose: 'PROF_ORIENTATION_ENRICHMENT',
    jsonSchema: ProfOrientationV3PlusEnrichmentJsonSchema,
    buildPrompt: ({ prompt, summary, questions, answers }) =>
      buildProfOrientationEnrichmentPrompt({
        prompt,
        algorithmSummary: summary as object,
        questions,
        answers,
      }),
    parse: parseProfOrientationV3PlusEnrichment,
    // Замеры 2026-10-08: Cloudflare отвечал 60–175 с и стоил в 15 раз дороже, поэтому исключён.
    provider: { preferred_min_throughput: { p50: 50 }, ignore: ['cloudflare'] },
    sessionIdPrefix: 'prof-orientation',
    timeoutMs: {
      envKeys: ['AI_PROF_ORIENTATION_TIMEOUT_MS', 'OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS'],
      fallback: PROF_ORIENTATION_AI_TIMEOUT_MS,
    },
    timeoutRetries: {
      envKeys: [
        'AI_PROF_ORIENTATION_TIMEOUT_RETRIES',
        'OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES',
      ],
      fallback: PROF_ORIENTATION_TIMEOUT_RETRIES,
      max: PROF_ORIENTATION_MAX_TIMEOUT_RETRIES,
    },
  },
  afterFinish: {
    isStale: (summary) =>
      isProfOrientationV3PlusSummary(summary) && shouldRefreshProfOrientationAtlasSummary(summary),
    apply: (analysisId, summary, services) =>
      isProfOrientationV3PlusSummary(summary)
        ? services.atlas.saveEnrichedAnalysis(analysisId, summary)
        : Promise.resolve(summary),
  },
  toPublic: (stored) =>
    isProfOrientationV3PlusSummary(stored) ? toPublicProfOrientationSummary(stored) : null,
  listSummary: (stored) => {
    const summary = getV3Summary(stored);

    return summary
      ? {
          primaryDirectionLabel: summary.primaryDirection?.name ?? null,
          profileTitle: summary.profile.title ?? null,
        }
      : null;
  },
  analytics: {
    countResults: (summaries) => summaries.filter((summary) => getV3Summary(summary)).length,
    buildSections: buildV3AnalyticsSections,
  },
  importTemplate: {
    slug: PROF_ORIENTATION_V3_PLUS_SLUG,
    title: PROF_ORIENTATION_V3_PLUS_TITLE,
    description: PROF_ORIENTATION_V3_PLUS_CONFIG.purpose,
    scoringConfig: toProfOrientationScoringConfig(),
    buildQuestions: buildProfOrientationV3PlusQuestionPayloads,
    prompt: {
      title: PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE,
      description: 'Built-in prompt for Polus prof-orientation v3+ result enrichment',
      model: PROF_ORIENTATION_V3_PLUS_PROMPT_MODEL,
      text: PROF_ORIENTATION_V3_PLUS_PROMPT,
    },
  },
};
