import type { ProfOrientationLlmState } from './polus-prof-orientation-llm-data';

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
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

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
  };
};
