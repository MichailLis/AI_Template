import type { TestScoringKind } from '@prisma/client';

import { profOrientationV3PlusMethodology } from '../prof-orientation-v3-plus/methodology';
import { defaultMethodology } from './default.methodology';
import type { AnalysisLlmStatus, ScoringMethodology } from './scoring-methodology';

/**
 * Реестр методик по `TestTopicVersion.scoringKind`. Тип `Record` не даёт добавить значение enum
 * без реализации. Единственное место общего контура, которое знает конкретные методики.
 */
const METHODOLOGIES: Record<TestScoringKind, ScoringMethodology> = {
  DEFAULT: defaultMethodology,
  PROF_ORIENTATION_V3_PLUS: profOrientationV3PlusMethodology,
};

export const getScoringMethodology = (kind: TestScoringKind): ScoringMethodology =>
  METHODOLOGIES[kind];

export const listScoringMethodologies = (): ScoringMethodology[] => Object.values(METHODOLOGIES);

/**
 * Методика, чей результат лежит в `summary`. Записи старых версий теста остаются с прежней
 * методикой, поэтому по виду теста их не определить: спрашиваем сами методики, `DEFAULT` — последним.
 */
export const getMethodologyBySummary = (summary: unknown): ScoringMethodology =>
  listScoringMethodologies().find(
    (methodology) => methodology.kind !== 'DEFAULT' && methodology.isSummary(summary),
  ) ?? defaultMethodology;

export const getSummaryLlmStatus = (summary: unknown): AnalysisLlmStatus | null =>
  getMethodologyBySummary(summary).llmStatus(summary);

/** Есть ли у версии алгоритмическая фаза до LLM. */
export const hasAlgorithmicPhase = (kind: TestScoringKind) =>
  getScoringMethodology(kind).score !== undefined;

/**
 * Разделы аналитики. Ответ `/analytics` плоский и описывает единственную методику с такими
 * разделами; записи считаются по виду `summary`, а не по виду темы, потому что в теме бывают
 * версии разных методик. Вторая методика с аналитикой потребует разделов по методикам в DTO.
 */
export const getAnalyticsSections = () => {
  const analytics = listScoringMethodologies().find(
    (methodology) => methodology.analytics,
  )?.analytics;

  if (!analytics) {
    throw new Error('No scoring methodology provides analytics sections');
  }

  return analytics;
};
