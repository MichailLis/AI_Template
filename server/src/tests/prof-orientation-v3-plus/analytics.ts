import { isRecord } from '../../common/type-guards';
import {
  buildCountShares,
  round1,
  toShare,
  type CountRecord,
} from '../reporting/analytics-summary';
import type {
  DirectionPairItem,
  FlagCountItem,
  MethodologyAnalyticsSections,
  ProfileCountItem,
  ShareItem,
} from '../reporting/analytics.types';
import { isProfOrientationV3PlusSummary, resolveProfOrientationV3PlusConfig } from './scoring';
import {
  PROF_ORIENTATION_DIRECTIONS,
  type ProfOrientationDirectionId,
  type ProfOrientationSummary,
} from './types';

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

/**
 * Всё, что нужно разделам аналитики от результата. Остальной `summary` (профессии, карточки,
 * текст LLM) — килобайты на попытку — в память не попадает.
 */
export type V3AnalyticsFacts = {
  primaryDirectionId: ProfOrientationDirectionId | null;
  secondaryDirectionId: ProfOrientationDirectionId | null;
  scores: Record<ProfOrientationDirectionId, number>;
  profile: { type: string; title: string };
  confidence: { level: string; gap: number; consistencyIndex: number; readinessTop: number };
  flags: { code: string; label: string }[];
};

/** `null` — не результат V3+ (заглушка, чужая методика, битая форма). */
export const toV3AnalyticsFacts = (value: unknown): V3AnalyticsFacts | null => {
  const summary = getV3Summary(value);

  return summary
    ? {
        primaryDirectionId: summary.primaryDirection?.id ?? null,
        secondaryDirectionId: summary.secondaryDirection?.id ?? null,
        scores: summary.scores,
        profile: { type: summary.profile.type, title: summary.profile.title },
        confidence: {
          level: summary.confidence.level,
          gap: summary.confidence.gap,
          consistencyIndex: summary.confidence.consistencyIndex,
          readinessTop: summary.confidence.readinessTop,
        },
        flags: summary.flags.map((flag) => ({ code: flag.code, label: flag.label })),
      }
    : null;
};

const getDirectionLabel = (
  directionLabelById: Map<ProfOrientationDirectionId, string>,
  directionId: ProfOrientationDirectionId,
) => directionLabelById.get(directionId) ?? directionId;

// Названия берём из конфига методики: направление, ни разу не бывшее первым/вторым, не попадёт в summary.
const collectDirectionLabels = (scoringConfig: unknown) => {
  const { directions } = resolveProfOrientationV3PlusConfig(scoringConfig);

  return new Map(PROF_ORIENTATION_DIRECTIONS.map((id) => [id, directions[id].name]));
};

const buildDirectionItems = (
  summaries: V3AnalyticsFacts[],
  directionLabelById: Map<ProfOrientationDirectionId, string>,
): ShareItem[] => {
  if (summaries.length === 0) {
    return [];
  }

  const counts = new Map<ProfOrientationDirectionId, CountRecord>();

  for (const summary of summaries) {
    const directionId = summary.primaryDirectionId;
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

const buildDirectionPairItems = (
  summaries: V3AnalyticsFacts[],
  directionLabelById: Map<ProfOrientationDirectionId, string>,
): DirectionPairItem[] => {
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
    const primaryDirectionId = summary.primaryDirectionId;
    const secondaryDirectionId = summary.secondaryDirectionId;
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

const buildScoreAverages = (
  summaries: V3AnalyticsFacts[],
  directionLabelById: Map<ProfOrientationDirectionId, string>,
) => {
  if (summaries.length === 0) {
    return [];
  }

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

const buildProfileItems = (summaries: V3AnalyticsFacts[]): ProfileCountItem[] => {
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
    profileType: item.id,
    label: item.label,
    count: item.count,
    share: item.share,
  }));
};

const buildConfidence = (summaries: V3AnalyticsFacts[]) => {
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

const buildFlagItems = (summaries: V3AnalyticsFacts[]): FlagCountItem[] => {
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
  summaries: readonly V3AnalyticsFacts[],
  scoringConfig?: unknown,
): MethodologyAnalyticsSections => {
  const directionLabelById = collectDirectionLabels(scoringConfig);
  const facts = [...summaries];

  return {
    directions: buildDirectionItems(facts, directionLabelById),
    directionPairs: buildDirectionPairItems(facts, directionLabelById),
    scoreAverages: buildScoreAverages(facts, directionLabelById),
    profiles: buildProfileItems(facts),
    confidence: buildConfidence(facts),
    flags: buildFlagItems(facts),
  };
};
