export const PROF_ORIENTATION_V3_PLUS_RESULT_KIND = 'prof_orientation_v3_plus';

export const PROF_ORIENTATION_DIRECTIONS = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'] as const;

export type ProfOrientationDirectionId = (typeof PROF_ORIENTATION_DIRECTIONS)[number];

export type ProfOrientationProfileType =
  'single_profile' | 'mixed_profile' | 'broad_interest' | 'low_definition';

export type ProfOrientationConfidenceLevel = 'high' | 'medium' | 'mixed' | 'broad' | 'low';

export interface ProfOrientationProfession {
  code: string;
  title: string;
  type?: string;
}

export interface ProfOrientationResultCard {
  headline: string;
  meaning: string;
  fitsIf: string[];
  tryActions: string[];
  learn: string[];
  miniProject: string;
}

export interface ProfOrientationDirectionSummary {
  id: ProfOrientationDirectionId;
  block: string;
  name: string;
  short: string;
  score: number;
  professions: ProfOrientationProfession[];
  resultCard: ProfOrientationResultCard;
}

export interface ProfOrientationFlag {
  code: 'interest_slider_conflict' | 'readiness_conflict';
  label: string;
  severity: 'info' | 'warning';
  directionId?: ProfOrientationDirectionId;
}

export type ProfOrientationAtlasStatus = 'ready' | 'partial' | 'unavailable';

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
  version?: number;
  status: ProfOrientationAtlasStatus;
  publicUrl: string | null;
  apiUrl: string | null;
  errorMessage?: string;
  /** Когда Атлас опрашивали; после сбоя повтор не раньше паузы от этого времени. */
  checkedAt?: string;
  unmatchedProfessions: string[];
  duplicateProfessions: string[];
  professions: ProfOrientationAtlasProfessionCard[];
  enterprises: ProfOrientationAtlasRecommendation[];
  events: ProfOrientationAtlasRecommendation[];
  institutions: ProfOrientationAtlasRecommendation[];
}

export interface ProfOrientationSummary {
  resultKind: typeof PROF_ORIENTATION_V3_PLUS_RESULT_KIND;
  scoringVersion: string;
  scores: Record<ProfOrientationDirectionId, number>;
  selectedCounts: Record<ProfOrientationDirectionId, number>;
  sliderValues: Record<string, number>;
  topDirections: ProfOrientationDirectionSummary[];
  primaryDirection: ProfOrientationDirectionSummary | null;
  secondaryDirection: ProfOrientationDirectionSummary | null;
  profile: {
    type: ProfOrientationProfileType;
    title: string;
    meaning: string;
    directions: ProfOrientationDirectionId[];
    miniProject: string | null;
  };
  confidence: {
    level: ProfOrientationConfidenceLevel;
    label: string;
    gap: number;
    consistencyIndex: number;
    readinessTop: number;
  };
  flags: ProfOrientationFlag[];
  llm: {
    status: 'not_requested' | 'pending' | 'ready' | 'failed';
    /** Фактическая модель ответа (ready) или модель из промпта (failed). */
    model?: string;
    analysis?: unknown;
    errorMessage?: string;
  };
  atlas?: ProfOrientationAtlasRecommendations;
}
