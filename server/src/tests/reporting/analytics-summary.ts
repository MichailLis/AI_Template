import {
  PROF_ORIENTATION_DIRECTIONS,
  type ProfOrientationDirectionId,
  type ProfOrientationSummary,
} from '../prof-orientation-v3-plus/types';
import { isProfOrientationV3PlusSummary } from '../prof-orientation-v3-plus/scoring';
import type {
  AnalyticsAttemptRecord,
  DirectionPairItem,
  FlagCountItem,
  ProfileCountItem,
  ShareItem,
  V3AnalyticsSections,
} from '../reporting/analytics.types';

type CountRecord = {
  label: string;
  count: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const isDirectionId = (value: unknown): value is ProfOrientationDirectionId =>
  typeof value === 'string' &&
  PROF_ORIENTATION_DIRECTIONS.includes(value as ProfOrientationDirectionId);

const isDirectionSummary = (value: unknown): value is ProfOrientationSummary['primaryDirection'] =>
  isRecord(value) && isDirectionId(value.id) && typeof value.name === 'string';

const hasValidScores = (value: unknown) =>
  isRecord(value) &&
  PROF_ORIENTATION_DIRECTIONS.every((directionId) => isFiniteNumber(value[directionId]));

const hasValidProfile = (value: unknown) => isRecord(value) && typeof value.type === 'string';

const hasValidConfidence = (value: unknown) =>
  isRecord(value) &&
  typeof value.level === 'string' &&
  isFiniteNumber(value.gap) &&
  isFiniteNumber(value.consistencyIndex) &&
  isFiniteNumber(value.readinessTop);

const hasValidFlags = (value: unknown) =>
  Array.isArray(value) && value.every((flag) => isRecord(flag) && typeof flag.code === 'string');

const hasValidV3SummaryShape = (value: unknown) =>
  isRecord(value) &&
  hasValidScores(value.scores) &&
  Array.isArray(value.topDirections) &&
  value.topDirections.every(isDirectionSummary) &&
  (value.primaryDirection === null || isDirectionSummary(value.primaryDirection)) &&
  (value.secondaryDirection === null || isDirectionSummary(value.secondaryDirection)) &&
  hasValidProfile(value.profile) &&
  hasValidConfidence(value.confidence) &&
  hasValidFlags(value.flags);

export const getV3Summary = (value: unknown): ProfOrientationSummary | null =>
  isProfOrientationV3PlusSummary(value) && hasValidV3SummaryShape(value) ? value : null;

export const toShare = (count: number, total: number) =>
  total === 0 ? 0 : round1((count / total) * 100);

export const buildCountShares = (counts: Map<string, CountRecord>, total: number): ShareItem[] =>
  Array.from(counts.entries())
    .map(([id, value]) => ({
      id,
      label: value.label,
      count: value.count,
      share: toShare(value.count, total),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

const getDirectionLabel = (
  directionLabelById: Map<ProfOrientationDirectionId, string>,
  directionId: ProfOrientationDirectionId,
) => directionLabelById.get(directionId) ?? directionId;

const collectDirectionLabels = (summaries: ProfOrientationSummary[]) => {
  const directionLabelById = new Map<ProfOrientationDirectionId, string>();

  for (const summary of summaries) {
    for (const direction of summary.topDirections) {
      directionLabelById.set(direction.id, direction.name);
    }
  }

  return directionLabelById;
};

const buildDirectionItems = (summaries: ProfOrientationSummary[]): ShareItem[] => {
  if (summaries.length === 0) {
    return [];
  }

  const directionLabelById = collectDirectionLabels(summaries);
  const counts = new Map<ProfOrientationDirectionId, CountRecord>();

  for (const summary of summaries) {
    const directionId = summary.primaryDirection?.id;
    if (!directionId) {
      continue;
    }

    const current = counts.get(directionId) ?? {
      label: getDirectionLabel(directionLabelById, directionId),
      count: 0,
    };
    counts.set(directionId, {
      label: current.label,
      count: current.count + 1,
    });
  }

  for (const directionId of PROF_ORIENTATION_DIRECTIONS) {
    counts.set(
      directionId,
      counts.get(directionId) ?? {
        label: getDirectionLabel(directionLabelById, directionId),
        count: 0,
      },
    );
  }

  return buildCountShares(
    new Map(Array.from(counts.entries()).map(([id, value]) => [id, value])),
    summaries.length,
  );
};

const buildDirectionPairItems = (summaries: ProfOrientationSummary[]): DirectionPairItem[] => {
  const directionLabelById = collectDirectionLabels(summaries);
  const counts = new Map<
    string,
    {
      primaryDirectionId: ProfOrientationDirectionId;
      secondaryDirectionId: ProfOrientationDirectionId;
      label: string;
      count: number;
    }
  >();

  for (const summary of summaries) {
    const primaryDirectionId = summary.primaryDirection?.id;
    const secondaryDirectionId = summary.secondaryDirection?.id;
    if (!primaryDirectionId || !secondaryDirectionId) {
      continue;
    }

    const key = `${primaryDirectionId}::${secondaryDirectionId}`;
    const current = counts.get(key);
    const label = `${getDirectionLabel(directionLabelById, primaryDirectionId)} + ${getDirectionLabel(directionLabelById, secondaryDirectionId)}`;
    counts.set(key, {
      primaryDirectionId,
      secondaryDirectionId,
      label,
      count: current ? current.count + 1 : 1,
    });
  }

  return Array.from(counts.values())
    .map((item) => ({
      primaryDirectionId: item.primaryDirectionId,
      secondaryDirectionId: item.secondaryDirectionId,
      label: item.label,
      count: item.count,
      share: toShare(item.count, summaries.length),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
};

const buildScoreAverages = (summaries: ProfOrientationSummary[]) => {
  if (summaries.length === 0) {
    return [];
  }

  const directionLabelById = collectDirectionLabels(summaries);
  const sums = new Map<ProfOrientationDirectionId, number>();
  const totalAttempts = summaries.length;
  const denominator = totalAttempts === 0 ? 1 : totalAttempts;

  for (const directionId of PROF_ORIENTATION_DIRECTIONS) {
    sums.set(directionId, 0);
  }

  for (const summary of summaries) {
    for (const directionId of PROF_ORIENTATION_DIRECTIONS) {
      const current = sums.get(directionId) ?? 0;
      sums.set(directionId, current + summary.scores[directionId]);
    }
  }

  return PROF_ORIENTATION_DIRECTIONS.map((directionId) => ({
    id: directionId,
    label: getDirectionLabel(directionLabelById, directionId),
    average: round1((sums.get(directionId) ?? 0) / denominator),
  }));
};

const buildProfileItems = (summaries: ProfOrientationSummary[]): ProfileCountItem[] => {
  const counts = new Map<string, CountRecord>();
  for (const summary of summaries) {
    const key = summary.profile.type;
    const current = counts.get(key) ?? { label: summary.profile.title, count: 0 };
    counts.set(key, {
      label: current.label,
      count: current.count + 1,
    });
  }

  return buildCountShares(counts, summaries.length).map((item) => ({
    profileType: item.id as ProfileCountItem['profileType'],
    label: item.label,
    count: item.count,
    share: item.share,
  }));
};

const buildConfidence = (summaries: ProfOrientationSummary[]) => {
  const total = summaries.length;
  if (total === 0) {
    return {
      levels: [],
      gap: { value: 0, total: 0 },
      consistencyIndex: { value: 0, total: 0 },
      readinessTop: { value: 0, total: 0 },
    };
  }

  const levelCounts = new Map<string, number>();
  let gap = 0;
  let consistencyIndex = 0;
  let readinessTop = 0;

  for (const summary of summaries) {
    levelCounts.set(summary.confidence.level, (levelCounts.get(summary.confidence.level) ?? 0) + 1);
    gap += summary.confidence.gap;
    consistencyIndex += summary.confidence.consistencyIndex;
    readinessTop += summary.confidence.readinessTop;
  }

  const levels = buildCountShares(
    new Map(Array.from(levelCounts.entries()).map(([id, count]) => [id, { label: id, count }])),
    total,
  ).map((item) => ({
    label: item.label,
    count: item.count,
    share: item.share,
  }));

  return {
    levels,
    gap: { value: round1(gap / total), total },
    consistencyIndex: { value: round1(consistencyIndex / total), total },
    readinessTop: { value: round1(readinessTop / total), total },
  };
};

const buildFlagItems = (summaries: ProfOrientationSummary[]): FlagCountItem[] => {
  const counts = new Map<string, CountRecord>();

  for (const summary of summaries) {
    for (const flag of summary.flags) {
      const current = counts.get(flag.code) ?? { label: flag.label, count: 0 };
      counts.set(flag.code, {
        label: current.label,
        count: current.count + 1,
      });
    }
  }

  return buildCountShares(counts, summaries.length).map((item) => ({
    flag: item.id,
    label: item.label,
    count: item.count,
    share: item.share,
  }));
};

export const buildV3AnalyticsSections = (
  attempts: readonly AnalyticsAttemptRecord[],
): V3AnalyticsSections => {
  const summaries = attempts
    .map((attempt) => getV3Summary(attempt.summary))
    .filter((summary): summary is ProfOrientationSummary => summary !== null);

  return {
    directions: buildDirectionItems(summaries),
    directionPairs: buildDirectionPairItems(summaries),
    scoreAverages: buildScoreAverages(summaries),
    profiles: buildProfileItems(summaries),
    confidence: buildConfidence(summaries),
    flags: buildFlagItems(summaries),
  };
};
