import { PublicAnalysisSummarySchema } from '../dto/tests-public-result.dto';
import {
  buildStoredProfOrientationSummary,
  storedAiAnalysis,
  storedAtlas,
  storedEnrichment,
} from './analysis-summary.spec-fixtures';
import { NO_PUBLIC_ANALYSIS_SUMMARY, toPublicAnalysisSummary } from './public-analysis-summary';

const withLlm = (llm: unknown) => ({ ...buildStoredProfOrientationSummary(), llm });

/** Every key at every depth, so a leaked field cannot hide inside a nested object. */
const collectKeys = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap(collectKeys)
    : typeof value === 'object' && value !== null
      ? Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)])
      : [];

const asProfOrientation = (summary: ReturnType<typeof toPublicAnalysisSummary>) => {
  if (summary.resultKind !== 'prof_orientation_v3_plus') {
    throw new Error(`Expected a prof-orientation summary, got ${summary.resultKind}`);
  }

  return summary;
};

describe('toPublicAnalysisSummary: prof-orientation v3+', () => {
  const stored = {
    ...buildStoredProfOrientationSummary(),
    llm: { status: 'ready', model: 'openai/gpt-oss-120b', analysis: storedEnrichment },
    atlas: storedAtlas,
  };

  it('cleans technical codes out of LLM text stored before the server did it', () => {
    const summary = asProfOrientation(
      toPublicAnalysisSummary({
        ...stored,
        llm: {
          status: 'ready',
          analysis: {
            ...storedEnrichment,
            summary: 'Сильная сторона: A1 (Q1_A1, Q2_A1, Q3_A1), gap 12.5',
          },
        },
      }),
    );

    expect(summary.llm.analysis?.summary).toBe('Сильная сторона: направление, отрыв по баллам');
  });

  it('keeps what the result screen renders, including the scores of the leading directions', () => {
    const summary = asProfOrientation(toPublicAnalysisSummary(stored));

    expect(summary.profile).toEqual({
      type: stored.profile.type,
      title: stored.profile.title,
      meaning: stored.profile.meaning,
      miniProject: stored.profile.miniProject,
    });
    expect(summary.confidence).toEqual({ label: stored.confidence.label });
    expect(summary.topDirections).toHaveLength(3);
    expect(summary.topDirections.map((direction) => direction.score)).toEqual(
      stored.topDirections.map((direction) => direction.score),
    );
    expect(summary.primaryDirection?.id).toBe(stored.primaryDirection?.id);
    expect(summary.primaryDirection?.resultCard.headline).toBe(
      stored.primaryDirection?.resultCard.headline,
    );
    expect(summary.atlas?.professions[0]?.url).toBe(storedAtlas.professions[0]?.url);
    expect(summary.llm.analysis?.professorSummary).toBe(storedEnrichment.professorSummary);
  });

  it('carries no scoring internals, counters, sliders, flags or diagnostics at any depth', () => {
    const keys = new Set(collectKeys(toPublicAnalysisSummary(stored)));

    for (const internal of [
      'scores',
      'selectedCounts',
      'sliderValues',
      'flags',
      'scoringVersion',
      'secondaryDirection',
      'level',
      'gap',
      'readinessTop',
      'consistencyIndex',
      'directions',
      'block',
      'short',
      'model',
      'errorMessage',
      'apiUrl',
      'publicUrl',
      'checkedAt',
      'version',
      'unmatchedProfessions',
      'duplicateProfessions',
      'confidenceComment',
      'methodSignals',
      'cautions',
    ]) {
      expect(keys).not.toContain(internal);
    }
  });

  it('exposes exactly the declared fields of each object, nothing the stored summary adds later', () => {
    const summary = asProfOrientation(
      toPublicAnalysisSummary({
        ...stored,
        futureCounter: 7,
        profile: { ...stored.profile, x: 1 },
      }),
    );

    expect(Object.keys(summary).sort()).toEqual(
      [
        'atlas',
        'confidence',
        'llm',
        'primaryDirection',
        'profile',
        'resultKind',
        'topDirections',
      ].sort(),
    );
    expect(Object.keys(summary.profile).sort()).toEqual([
      'meaning',
      'miniProject',
      'title',
      'type',
    ]);
    expect(Object.keys(summary.topDirections[0] ?? {}).sort()).toEqual(
      ['id', 'name', 'professions', 'resultCard', 'score'].sort(),
    );
    expect(Object.keys(summary.llm.analysis ?? {}).sort()).toEqual(
      [
        'firstSteps',
        'learningPlan',
        'nextMiniProject',
        'professionNotes',
        'professorSummary',
        'summary',
      ].sort(),
    );
  });

  it.each(['not_requested', 'pending', 'ready', 'failed'] as const)(
    'reports llm.status %s from the stored summary, not from the record status',
    (status) => {
      const summary = asProfOrientation(toPublicAnalysisSummary(withLlm({ status })));

      expect(summary.llm).toEqual({ status, analysis: null });
    },
  );

  it('reads an unknown stored llm status as not requested', () => {
    expect(
      asProfOrientation(toPublicAnalysisSummary(withLlm({ status: 'weird' }))).llm.status,
    ).toBe('not_requested');
    expect(asProfOrientation(toPublicAnalysisSummary(withLlm(undefined))).llm.status).toBe(
      'not_requested',
    );
  });

  it('keeps the computed result when the atlas or the LLM text is broken', () => {
    const summary = asProfOrientation(
      toPublicAnalysisSummary({
        ...stored,
        atlas: { status: 'ready', professions: 'nope' },
        llm: { status: 'ready', analysis: { summary: 42 } },
      }),
    );

    expect(summary.atlas).toBeNull();
    expect(summary.llm).toEqual({ status: 'ready', analysis: null });
    expect(summary.topDirections).toHaveLength(3);
  });

  it('shows no result instead of a half-built one when the computed part is unreadable', () => {
    expect(toPublicAnalysisSummary({ ...stored, profile: null })).toEqual(
      NO_PUBLIC_ANALYSIS_SUMMARY,
    );
    expect(toPublicAnalysisSummary({ ...stored, topDirections: 'nope' })).toEqual(
      NO_PUBLIC_ANALYSIS_SUMMARY,
    );
  });

  it('produces something the response schema accepts unchanged', () => {
    const summary = toPublicAnalysisSummary(stored);

    expect(PublicAnalysisSummarySchema.parse(summary)).toEqual(summary);
  });
});

describe('toPublicAnalysisSummary: standard AI analysis', () => {
  it('passes a current analysis through under the ai_analysis kind', () => {
    const summary = toPublicAnalysisSummary(storedAiAnalysis);

    expect(summary).toEqual({ resultKind: 'ai_analysis', ...storedAiAnalysis });
    expect(PublicAnalysisSummarySchema.parse(summary)).toEqual(summary);
  });

  it('drops keys the schema does not declare, at every level', () => {
    const summary = toPublicAnalysisSummary({
      ...storedAiAnalysis,
      internalNote: 'x',
      skillsLevel: {
        ...storedAiAnalysis.skillsLevel,
        items: [{ ...storedAiAnalysis.skillsLevel.items[0], rawScore: 0.123 }],
      },
    });

    expect(collectKeys(summary)).not.toContain('internalNote');
    expect(collectKeys(summary)).not.toContain('rawScore');
  });

  it('rebuilds the introduction of an analysis saved before it existed', () => {
    const summary = toPublicAnalysisSummary({ ...storedAiAnalysis, introduction: undefined });

    expect(summary).toMatchObject({
      resultKind: 'ai_analysis',
      introduction:
        'По результатам теста сформирован персональный анализ: аналитический. Навыки развиты на среднем уровне.',
    });
  });

  it('trims overfilled lists, drops duplicates and heading-like traits, skips unreadable items', () => {
    const summary = toPublicAnalysisSummary({
      ...storedAiAnalysis,
      skillsLevel: {
        ...storedAiAnalysis.skillsLevel,
        items: [
          ...Array.from({ length: 8 }, (_, index) => ({
            name: `Навык ${index}`,
            level: 'high',
            description: 'Описание',
          })),
          { name: 'Без уровня', level: 'unknown', description: 'Описание' },
        ],
      },
      personalityTraits: {
        title: 'Черты',
        traits: [
          { name: 'Общие выводы', description: 'x', careerImpact: 'y' },
          { name: 'Усидчивость', description: 'x', careerImpact: 'y' },
          { name: ' усидчивость ', description: 'x', careerImpact: 'y' },
        ],
      },
      careerDevelopment: {
        ...storedAiAnalysis.careerDevelopment,
        professionalNextSteps: ['a', 'A ', 'b', 'c', 'd'],
      },
    });

    expect(summary.resultKind).toBe('ai_analysis');
    if (summary.resultKind !== 'ai_analysis') return;
    expect(summary.skillsLevel.items).toHaveLength(6);
    expect(summary.skillsLevel.items[0]?.score).toBeNull();
    expect(summary.personalityTraits.traits.map((trait) => trait.name)).toEqual(['Усидчивость']);
    expect(summary.careerDevelopment.professionalNextSteps).toEqual(['a', 'b', 'c']);
  });

  it.each([
    ['without any skill item', { skillsLevel: { ...storedAiAnalysis.skillsLevel, items: [] } }],
    ['without a thinking type', { thinkingType: { ...storedAiAnalysis.thinkingType, type: '' } }],
    ['without traits', { personalityTraits: { title: 'x', traits: [] } }],
    [
      'without development recommendations',
      {
        careerDevelopment: {
          ...storedAiAnalysis.careerDevelopment,
          developmentRecommendations: [],
        },
      },
    ],
    ['without the career section', { careerDevelopment: null }],
  ])('shows no result for an analysis %s', (_label, override) => {
    expect(toPublicAnalysisSummary({ ...storedAiAnalysis, ...override })).toEqual(
      NO_PUBLIC_ANALYSIS_SUMMARY,
    );
  });
});

describe('toPublicAnalysisSummary: no result', () => {
  it.each([
    ['a stub', { mode: 'stub', note: 'placeholder', completionRate: 100 }],
    ['a missing summary', null],
    ['an undefined summary', undefined],
    ['a string', 'not-an-object'],
    ['an array', [storedAiAnalysis]],
    ['an empty object', {}],
  ])('maps %s to the explicit none variant', (_label, stored) => {
    expect(toPublicAnalysisSummary(stored)).toEqual({ resultKind: 'none' });
  });
});
