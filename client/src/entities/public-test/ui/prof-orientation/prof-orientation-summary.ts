import { isRecord } from '@/shared/lib/type-guards';

import type {
  PublicAtlasProfession,
  PublicAtlasRecommendation,
  PublicProfOrientationAtlas,
  PublicProfOrientationDirection,
  PublicProfOrientationEnrichment,
  PublicProfOrientationSummary,
} from '@/shared/api/model';

/** What the result screen draws: the public projection the server sends to a student. */
export type ProfOrientationSummary = PublicProfOrientationSummary;
export type ProfOrientationDirection = PublicProfOrientationDirection;
export type ProfOrientationAtlasProfessionCard = PublicAtlasProfession;
export type ProfOrientationAtlasRecommendation = PublicAtlasRecommendation;
export type ProfOrientationAtlasRecommendations = PublicProfOrientationAtlas;

/*
 * Everything below reads the admin response, whose `summary` is the full stored object
 * (`unknown` in the API). The student's response is typed and is never parsed here: it goes
 * straight to the screen. This parser picks from the admin object the same fields the student's
 * projection carries, so the admin preview shows what the student sees.
 */

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const nullableString = (value: unknown) => (typeof value === 'string' ? value : null);

const parseProfOrientationDirection = (value: unknown): ProfOrientationDirection | null => {
  if (!isRecord(value) || !isRecord(value.resultCard)) {
    return null;
  }

  if (typeof value.id !== 'string' || typeof value.name !== 'string') {
    return null;
  }

  const resultCard = value.resultCard;
  const professions = Array.isArray(value.professions)
    ? value.professions
        .filter(isRecord)
        .map((profession) => ({
          code: typeof profession.code === 'string' ? profession.code : '',
          title: typeof profession.title === 'string' ? profession.title : '',
        }))
        .filter((profession) => profession.code && profession.title)
    : [];

  if (
    typeof value.score !== 'number' ||
    typeof resultCard.headline !== 'string' ||
    typeof resultCard.meaning !== 'string' ||
    typeof resultCard.miniProject !== 'string' ||
    !isStringArray(resultCard.fitsIf) ||
    !isStringArray(resultCard.tryActions) ||
    !isStringArray(resultCard.learn)
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    score: value.score,
    professions,
    resultCard: {
      headline: resultCard.headline,
      meaning: resultCard.meaning,
      fitsIf: resultCard.fitsIf,
      tryActions: resultCard.tryActions,
      learn: resultCard.learn,
      miniProject: resultCard.miniProject,
    },
  };
};

const parseAtlasRecommendation = (value: unknown): ProfOrientationAtlasRecommendation | null => {
  if (
    !isRecord(value) ||
    typeof value.title !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.url !== 'string'
  ) {
    return null;
  }

  return {
    title: value.title,
    slug: value.slug,
    url: value.url,
    summary: nullableString(value.summary),
    subtitle: nullableString(value.subtitle),
  };
};

const parseAtlasProfessionCard = (value: unknown): ProfOrientationAtlasProfessionCard | null => {
  if (
    !isRecord(value) ||
    (value.source !== 'primary' && value.source !== 'secondary') ||
    typeof value.requestedTitle !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.url !== 'string'
  ) {
    return null;
  }

  return {
    source: value.source,
    requestedTitle: value.requestedTitle,
    title: value.title,
    slug: value.slug,
    url: value.url,
    summary: nullableString(value.summary),
    demandLevel: nullableString(value.demandLevel),
    industry: nullableString(value.industry),
    municipality: nullableString(value.municipality),
    skills: isStringArray(value.skills) ? value.skills : [],
  };
};

const parseList = <T>(value: unknown, parseItem: (item: unknown) => T | null) =>
  Array.isArray(value) ? value.map(parseItem).filter((item): item is T => item !== null) : [];

const parseAtlasRecommendations = (value: unknown): ProfOrientationAtlasRecommendations | null => {
  if (
    !isRecord(value) ||
    (value.status !== 'ready' && value.status !== 'partial' && value.status !== 'unavailable')
  ) {
    return null;
  }

  return {
    status: value.status,
    professions: parseList(value.professions, parseAtlasProfessionCard),
    enterprises: parseList(value.enterprises, parseAtlasRecommendation),
    events: parseList(value.events, parseAtlasRecommendation),
    institutions: parseList(value.institutions, parseAtlasRecommendation),
  };
};

const parseEnrichment = (value: unknown): PublicProfOrientationEnrichment | null => {
  if (
    !isRecord(value) ||
    typeof value.summary !== 'string' ||
    typeof value.nextMiniProject !== 'string'
  ) {
    return null;
  }

  return {
    professorSummary: nullableString(value.professorSummary),
    summary: value.summary,
    firstSteps: isStringArray(value.firstSteps) ? value.firstSteps : [],
    learningPlan: isStringArray(value.learningPlan) ? value.learningPlan : [],
    professionNotes: isStringArray(value.professionNotes) ? value.professionNotes : [],
    nextMiniProject: value.nextMiniProject,
  };
};

const LLM_STATUSES = ['not_requested', 'pending', 'ready', 'failed'] as const;

export const parseProfOrientationSummary = (value: unknown): ProfOrientationSummary | null => {
  if (!isRecord(value) || value.resultKind !== 'prof_orientation_v3_plus') {
    return null;
  }

  const confidence = isRecord(value.confidence) ? value.confidence : null;
  const profile = isRecord(value.profile) ? value.profile : null;
  const llm = isRecord(value.llm) ? value.llm : null;

  if (!confidence || !profile || typeof confidence.label !== 'string') {
    return null;
  }

  if (
    typeof profile.type !== 'string' ||
    typeof profile.title !== 'string' ||
    typeof profile.meaning !== 'string'
  ) {
    return null;
  }

  return {
    resultKind: 'prof_orientation_v3_plus',
    primaryDirection: parseProfOrientationDirection(value.primaryDirection),
    topDirections: parseList(value.topDirections, parseProfOrientationDirection),
    confidence: { label: confidence.label },
    profile: {
      type: profile.type,
      title: profile.title,
      meaning: profile.meaning,
      miniProject: nullableString(profile.miniProject),
    },
    llm: {
      status: LLM_STATUSES.find((status) => status === llm?.status) ?? 'not_requested',
      analysis: parseEnrichment(llm?.analysis),
    },
    atlas: parseAtlasRecommendations(value.atlas),
  };
};
