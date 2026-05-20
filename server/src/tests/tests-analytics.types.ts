import type {
  ProfOrientationDirectionId,
  ProfOrientationProfileType,
  ProfOrientationSummary,
} from './prof-orientation-v3-plus.types';

export type AnalyticsAttemptRecord = {
  attemptId: number;
  status: string;
  analysisStatus: string | null;
  summary: unknown;
};

export type ShareItem = {
  id: string;
  label: string;
  count: number;
  share: number;
};

export type DirectionPairItem = {
  primaryDirectionId: ProfOrientationDirectionId;
  secondaryDirectionId: ProfOrientationDirectionId;
  label: string;
  count: number;
  share: number;
};

export type ScoreAverageItem = {
  id: string;
  label: string;
  average: number;
};

export type ProfileCountItem = {
  profileType: ProfOrientationProfileType;
  count: number;
  share: number;
};

export type ConfidenceLevelItem = {
  label: string;
  count: number;
  share: number;
};

export type FlagCountItem = {
  flag: string;
  count: number;
  share: number;
};

export type ConfidenceSection = {
  levels: ConfidenceLevelItem[];
  gap: {
    value: number;
    total: number;
  };
  consistencyIndex: {
    value: number;
    total: number;
  };
  readinessTop: {
    value: number;
    total: number;
  };
};

export type V3AnalyticsSections = {
  directions: ShareItem[];
  directionPairs: DirectionPairItem[];
  scoreAverages: ScoreAverageItem[];
  profiles: ProfileCountItem[];
  confidence: ConfidenceSection;
  flags: FlagCountItem[];
};

export type V3SummaryLike = ProfOrientationSummary;
