import { PROF_ORIENTATION_DIRECTIONS } from './prof-orientation-v3-plus.types';
import {
  buildCountShares,
  buildV3AnalyticsSections,
  getV3Summary,
  toShare,
} from './tests-analytics-summary';

const createDirectionSummary = (directionId: (typeof PROF_ORIENTATION_DIRECTIONS)[number]) => ({
  id: directionId,
  block: `block-${directionId}`,
  name: `Direction ${directionId}`,
  short: directionId,
  score: 0,
  professions: [],
  resultCard: {
    headline: 'Headline',
    meaning: 'Meaning',
    fitsIf: ['f1'],
    tryActions: ['t1'],
    learn: ['l1'],
    miniProject: 'Project',
  },
});

const createSummary = (input: {
  primaryDirection: (typeof PROF_ORIENTATION_DIRECTIONS)[number];
  secondaryDirection: (typeof PROF_ORIENTATION_DIRECTIONS)[number];
  profileType: 'single_profile' | 'mixed_profile';
  confidenceLevel: 'low' | 'medium' | 'high' | 'mixed' | 'broad';
  flags?: Array<'readiness_conflict' | 'interest_slider_conflict' | 'overchoice'>;
  scores?: Partial<Record<(typeof PROF_ORIENTATION_DIRECTIONS)[number], number>>;
}) => {
  const topDirections = [
    createDirectionSummary(input.primaryDirection),
    createDirectionSummary(input.secondaryDirection),
    createDirectionSummary('A3'),
  ];
  const directionScores = Object.fromEntries(
    PROF_ORIENTATION_DIRECTIONS.map((directionId) => [
      directionId,
      input.scores?.[directionId] ?? 0,
    ]),
  ) as Record<(typeof PROF_ORIENTATION_DIRECTIONS)[number], number>;

  return {
    resultKind: 'prof_orientation_v3_plus',
    scoringVersion: '3.0',
    scores: directionScores,
    selectedCounts: directionScores,
    sliderValues: {},
    topDirections,
    primaryDirection: topDirections[0],
    secondaryDirection: topDirections[1],
    profile: {
      type: input.profileType,
      title: input.profileType === 'mixed_profile' ? 'Mixed profile' : 'Single profile',
      meaning: 'Profile meaning',
      directions:
        input.profileType === 'mixed_profile'
          ? [input.primaryDirection, input.secondaryDirection]
          : [input.primaryDirection],
      miniProject: null,
    },
    confidence: {
      level: input.confidenceLevel,
      label: 'label',
      gap: 10,
      consistencyIndex: 0.7,
      readinessTop: 5,
    },
    flags:
      input.flags?.map((flag) => ({
        code: flag,
        label: `${flag}`,
        severity: 'warning',
      })) ?? [],
    llm: { status: 'not_requested' },
  };
};

const createAttempt = (id: number, summary: unknown) => ({
  attemptId: id,
  status: 'COMPLETED' as const,
  analysisStatus: 'READY' as const,
  summary,
});

describe('getV3Summary', () => {
  it('returns summary for valid v3+ payload and null otherwise', () => {
    const valid = getV3Summary(
      createSummary({
        primaryDirection: 'A1',
        secondaryDirection: 'A2',
        profileType: 'single_profile',
        confidenceLevel: 'high',
      }),
    );
    const invalid = getV3Summary({ resultKind: 'other' });

    expect(valid).not.toBeNull();
    expect(valid?.resultKind).toBe('prof_orientation_v3_plus');
    expect(invalid).toBeNull();
  });
});

describe('toShare', () => {
  it('returns share with 0.1% precision', () => {
    expect(toShare(1, 3)).toBe(33.3);
    expect(toShare(1, 0)).toBe(0);
  });
});

describe('buildCountShares', () => {
  it('builds share objects from counts and sorts by count then label', () => {
    const result = buildCountShares(
      new Map([
        ['B1', { label: 'B1', count: 1 }],
        ['A2', { label: 'A2', count: 2 }],
      ]),
      3,
    );

    expect(result).toEqual([
      { id: 'A2', label: 'A2', count: 2, share: 66.7 },
      { id: 'B1', label: 'B1', count: 1, share: 33.3 },
    ]);
  });
});

describe('buildV3AnalyticsSections', () => {
  it('aggregates directions, pairs, scores, profiles, confidence and flags from valid v3 summaries', () => {
    const attempts = [
      createAttempt(
        1,
        createSummary({
          primaryDirection: 'A1',
          secondaryDirection: 'A2',
          profileType: 'mixed_profile',
          confidenceLevel: 'mixed',
          scores: {
            A1: 10,
            A2: 20,
            A3: 30,
            B1: 40,
            B2: 50,
            B3: 60,
          },
          flags: ['readiness_conflict', 'interest_slider_conflict'],
        }),
      ),
      createAttempt(
        2,
        createSummary({
          primaryDirection: 'B3',
          secondaryDirection: 'B1',
          profileType: 'single_profile',
          confidenceLevel: 'high',
          scores: {
            A1: 20,
            A2: 18,
            A3: 28,
            B1: 44,
            B2: 52,
            B3: 62,
          },
        }),
      ),
      createAttempt(3, { resultKind: 'other' }),
      createAttempt(4, null),
    ];
    const result = buildV3AnalyticsSections(attempts);

    const byDirection = Object.fromEntries(result.directions.map((item) => [item.id, item]));
    expect(byDirection.A1).toMatchObject({ count: 1, share: 50 });
    expect(byDirection.B3).toMatchObject({ count: 1, share: 50 });
    expect(byDirection.A2).toMatchObject({ count: 0, share: 0 });

    expect(result.directionPairs).toEqual(
      expect.arrayContaining([
        {
          primaryDirectionId: 'A1',
          secondaryDirectionId: 'A2',
          label: 'Direction A1 + Direction A2',
          count: 1,
          share: 50,
        },
        {
          primaryDirectionId: 'B3',
          secondaryDirectionId: 'B1',
          label: 'Direction B3 + Direction B1',
          count: 1,
          share: 50,
        },
      ]),
    );

    const scores = Object.fromEntries(result.scoreAverages.map((item) => [item.id, item.average]));
    expect(scores.A1).toBe(15);
    expect(scores.A2).toBe(19);
    expect(scores.A3).toBe(29);
    expect(scores.B1).toBe(42);
    expect(scores.B2).toBe(51);
    expect(scores.B3).toBe(61);

    expect(result.profiles).toEqual(
      expect.arrayContaining([
        { profileType: 'mixed_profile', count: 1, share: 50 },
        { profileType: 'single_profile', count: 1, share: 50 },
      ]),
    );

    expect(result.confidence.levels).toEqual(
      expect.arrayContaining([
        { level: 'high', count: 1, share: 50 },
        { level: 'mixed', count: 1, share: 50 },
      ]),
    );
    expect(result.confidence.gap).toMatchObject({ value: 10, total: 2 });
    expect(result.confidence.consistencyIndex).toMatchObject({ value: 0.7, total: 2 });
    expect(result.confidence.readinessTop).toMatchObject({ value: 5, total: 2 });

    expect(result.flags).toEqual(
      expect.arrayContaining([
        { flag: 'readiness_conflict', count: 1, share: 50 },
        { flag: 'interest_slider_conflict', count: 1, share: 50 },
      ]),
    );

    expect(result.directionPairs).toHaveLength(2);
    expect(result.profiles).toHaveLength(2);
    expect(result.flags).toHaveLength(2);
  });
});
