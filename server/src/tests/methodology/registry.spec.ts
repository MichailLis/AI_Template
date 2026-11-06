import { TestScoringKind } from '@prisma/client';

import {
  PROF_ORIENTATION_V3_PLUS_CONFIG,
  buildProfOrientationV3PlusQuestionPayloads,
} from '../prof-orientation-v3-plus/fixture';
import { scoreProfOrientationV3Plus } from '../prof-orientation-v3-plus/scoring';
import {
  getAnalyticsSections,
  getMethodologyBySummary,
  getScoringMethodology,
  getSummaryLlmStatus,
  hasAlgorithmicPhase,
  listScoringMethodologies,
} from './registry';

const v3Summary = scoreProfOrientationV3Plus({
  questions: buildProfOrientationV3PlusQuestionPayloads().map((question, index) => ({
    id: index + 1,
    type: question.type,
    settings: question.settings,
    options: question.options.map((option) => ({ value: option.value })),
  })),
  answers: [],
  config: PROF_ORIENTATION_V3_PLUS_CONFIG,
  llmStatus: 'pending',
});

describe('scoring methodology registry', () => {
  it('has one methodology per scoringKind, each registered under its own kind', () => {
    for (const kind of Object.values(TestScoringKind)) {
      expect(getScoringMethodology(kind).kind).toBe(kind);
    }
    expect(listScoringMethodologies()).toHaveLength(Object.values(TestScoringKind).length);
  });

  it('gives DEFAULT the same interface without an algorithmic phase', () => {
    const methodology = getScoringMethodology('DEFAULT');

    expect('score' in methodology).toBe(false);
    expect(methodology.enrichment.purpose).toBe('STUDENT_ANALYSIS');
    expect(hasAlgorithmicPhase('DEFAULT')).toBe(false);
    expect(hasAlgorithmicPhase('PROF_ORIENTATION_V3_PLUS')).toBe(true);
  });

  it('recognises a stored summary by its methodology and falls back to DEFAULT', () => {
    expect(getMethodologyBySummary(v3Summary).kind).toBe('PROF_ORIENTATION_V3_PLUS');
    expect(getMethodologyBySummary({ introduction: 'x' }).kind).toBe('DEFAULT');
    expect(getMethodologyBySummary(null).kind).toBe('DEFAULT');
  });

  it('reads the llm status only from methodologies that have an algorithmic phase', () => {
    expect(getSummaryLlmStatus(v3Summary)).toBe('pending');
    expect(getSummaryLlmStatus({ llm: { status: 'ready' } })).toBeNull();
  });

  it('declares the same resultKind as the public projection it produces', () => {
    const methodology = getScoringMethodology('PROF_ORIENTATION_V3_PLUS');

    expect(methodology.toPublic(v3Summary)?.resultKind).toBe(methodology.resultKind);
    expect(methodology.toPublic({})).toBeNull();
    expect(getScoringMethodology('DEFAULT').toPublic({})).toBeNull();
  });

  it('exposes analytics sections from the methodology that has them', () => {
    const analytics = getAnalyticsSections();
    expect(analytics.toFacts(v3Summary)).not.toBeNull();
    expect(analytics.toFacts({})).toBeNull();
    expect(analytics.toFacts(null)).toBeNull();
  });
});
