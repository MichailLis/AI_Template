import { isRecord } from '@/shared/lib/type-guards';

import type { ProfOrientationLlmState } from './prof-orientation-llm-data';

export interface ProfOrientationDirection {
  id: string;
  name: string;
  score: number;
  professions: Array<{
    code: string;
    title: string;
  }>;
  resultCard: {
    headline: string;
    meaning: string;
    fitsIf: string[];
    tryActions: string[];
    learn: string[];
    miniProject: string;
  };
}

export interface ProfOrientationAtlasProfessionCard {
  source: 'primary' | 'secondary';
  requestedTitle: string;
  title: string;
  slug: string;
  url: string;
  summary: string | null;
  demandLevel: string | null;
  industry: string | null;
  municipality: string | null;
  skills: string[];
}

export interface ProfOrientationAtlasRecommendation {
  title: string;
  slug: string;
  url: string;
  summary: string | null;
  subtitle: string | null;
}

export interface ProfOrientationAtlasRecommendations {
  status: 'ready' | 'partial' | 'unavailable';
  publicUrl: string | null;
  apiUrl: string | null;
  errorMessage: string | null;
  unmatchedProfessions: string[];
  duplicateProfessions: string[];
  professions: ProfOrientationAtlasProfessionCard[];
  enterprises: ProfOrientationAtlasRecommendation[];
  events: ProfOrientationAtlasRecommendation[];
  institutions: ProfOrientationAtlasRecommendation[];
}

export interface ProfOrientationSummary {
  resultKind: 'prof_orientation_v3_plus';
  primaryDirection: ProfOrientationDirection | null;
  topDirections: ProfOrientationDirection[];
  confidence: {
    label: string;
  };
  profile: {
    type: string;
    title: string;
    meaning: string;
    miniProject: string | null;
  };
  llm: ProfOrientationLlmState;
  atlas: ProfOrientationAtlasRecommendations | null;
}

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

const parseAtlasRecommendations = (value: unknown): ProfOrientationAtlasRecommendations | null => {
  if (
    !isRecord(value) ||
    (value.status !== 'ready' && value.status !== 'partial' && value.status !== 'unavailable')
  ) {
    return null;
  }

  return {
    status: value.status,
    publicUrl: nullableString(value.publicUrl),
    apiUrl: nullableString(value.apiUrl),
    errorMessage: nullableString(value.errorMessage),
    unmatchedProfessions: isStringArray(value.unmatchedProfessions)
      ? value.unmatchedProfessions
      : [],
    duplicateProfessions: isStringArray(value.duplicateProfessions)
      ? value.duplicateProfessions
      : [],
    professions: Array.isArray(value.professions)
      ? value.professions
          .map((item) => parseAtlasProfessionCard(item))
          .filter((item): item is ProfOrientationAtlasProfessionCard => item !== null)
      : [],
    enterprises: Array.isArray(value.enterprises)
      ? value.enterprises
          .map((item) => parseAtlasRecommendation(item))
          .filter((item): item is ProfOrientationAtlasRecommendation => item !== null)
      : [],
    events: Array.isArray(value.events)
      ? value.events
          .map((item) => parseAtlasRecommendation(item))
          .filter((item): item is ProfOrientationAtlasRecommendation => item !== null)
      : [],
    institutions: Array.isArray(value.institutions)
      ? value.institutions
          .map((item) => parseAtlasRecommendation(item))
          .filter((item): item is ProfOrientationAtlasRecommendation => item !== null)
      : [],
  };
};

export const parseProfOrientationSummary = (value: unknown): ProfOrientationSummary | null => {
  if (!isRecord(value) || value.resultKind !== 'prof_orientation_v3_plus') {
    return null;
  }

  const primaryDirection = parseProfOrientationDirection(value.primaryDirection);
  const topDirections = Array.isArray(value.topDirections)
    ? value.topDirections
        .map((direction) => parseProfOrientationDirection(direction))
        .filter((direction): direction is ProfOrientationDirection => direction !== null)
    : [];
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
    primaryDirection,
    topDirections,
    confidence: {
      label: confidence.label,
    },
    profile: {
      type: profile.type,
      title: profile.title,
      meaning: profile.meaning,
      miniProject: typeof profile.miniProject === 'string' ? profile.miniProject : null,
    },
    llm: {
      status: typeof llm?.status === 'string' ? llm.status : 'not_requested',
      analysis: llm && 'analysis' in llm ? llm.analysis : null,
      errorMessage: typeof llm?.errorMessage === 'string' ? llm.errorMessage : null,
    },
    atlas: parseAtlasRecommendations(value.atlas),
  };
};
