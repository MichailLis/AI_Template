import { isRecord } from '@/shared/lib/type-guards';

import { mockAnalysisReport } from './public-test-analysis.mock';

import type {
  AnalysisActionPlanStep,
  AnalysisProfessionRecommendation,
  AnalysisTraitScore,
  PublicTestAnalysisReportViewModel,
} from './public-test-analysis.types';

interface PublicAnalysisPayload {
  summary: unknown;
}

const readString = (value: unknown): string | null => {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
};

const readNumber = (value: unknown): number | null => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return value;
};

const clampScore = (value: number, maxValue: number) => {
  if (maxValue <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(maxValue, value));
};

const adaptProfessions = (summary: Record<string, unknown>): AnalysisProfessionRecommendation[] => {
  const value = summary.professions;
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const title = readString(item.title);
      const score = readNumber(item.matchScore);
      const description = readString(item.description);

      if (!title || score === null || !description) {
        return null;
      }

      return {
        rank: readNumber(item.rank) ?? index + 1,
        title,
        matchScore: Math.max(0, Math.min(100, score)),
        salary: readString(item.salary) ?? 'По данным работодателей',
        growth: readString(item.growth) ?? 'Данные уточняются',
        description,
      } satisfies AnalysisProfessionRecommendation;
    })
    .filter((item): item is AnalysisProfessionRecommendation => item !== null);

  return parsed;
};

const adaptTraitScores = (summary: Record<string, unknown>): AnalysisTraitScore[] => {
  const value = summary.traitScores;
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const label = readString(item.label);
      const score = readNumber(item.value);

      if (!label || score === null) {
        return null;
      }

      const maxValue = readNumber(item.maxValue) ?? 100;

      return {
        key: readString(item.key) ?? `trait-${index + 1}`,
        label,
        value: clampScore(score, maxValue),
        maxValue,
      } satisfies AnalysisTraitScore;
    })
    .filter((item): item is AnalysisTraitScore => item !== null);

  return parsed;
};

const adaptActionPlan = (summary: Record<string, unknown>): AnalysisActionPlanStep[] => {
  const value = summary.actionPlan;
  if (!Array.isArray(value)) {
    return [];
  }

  const parsed = value
    .map((item, index) => {
      if (!isRecord(item)) {
        return null;
      }

      const title = readString(item.title);
      const description = readString(item.description);
      const timeframe = readString(item.timeframe);

      if (!title || !description || !timeframe) {
        return null;
      }

      return {
        id: readString(item.id) ?? `plan-${index + 1}`,
        title,
        description,
        timeframe,
      } satisfies AnalysisActionPlanStep;
    })
    .filter((item): item is AnalysisActionPlanStep => item !== null);

  return parsed;
};

export const adaptPublicAnalysisReport = ({
  summary,
}: PublicAnalysisPayload): PublicTestAnalysisReportViewModel => {
  if (!isRecord(summary)) {
    return {
      ...mockAnalysisReport,
      hasMockContent: true,
    };
  }

  const professions = adaptProfessions(summary);
  const traitScores = adaptTraitScores(summary);
  const actionPlan = adaptActionPlan(summary);

  const answeredQuestionsCount = readNumber(summary.answeredQuestionsCount);
  const totalQuestionsCount = readNumber(summary.totalQuestionsCount);

  const completionRateFromSummary = readNumber(summary.completionRate);
  const completionRateDerived =
    answeredQuestionsCount !== null && totalQuestionsCount !== null && totalQuestionsCount > 0
      ? Math.round((answeredQuestionsCount / totalQuestionsCount) * 100)
      : null;

  const hasStructuredData =
    professions.length > 0 || traitScores.length > 0 || actionPlan.length > 0;

  return {
    archetypeTitle: readString(summary.archetypeTitle) ?? mockAnalysisReport.archetypeTitle,
    archetypeDescription:
      readString(summary.archetypeDescription) ?? mockAnalysisReport.archetypeDescription,
    completionRate:
      completionRateFromSummary ?? completionRateDerived ?? mockAnalysisReport.completionRate,
    answeredQuestionsCount,
    totalQuestionsCount,
    note: readString(summary.note) ?? mockAnalysisReport.note,
    narrative: readString(summary.narrative) ?? mockAnalysisReport.narrative,
    professions: professions.length > 0 ? professions : mockAnalysisReport.professions,
    traitScores: traitScores.length > 0 ? traitScores : mockAnalysisReport.traitScores,
    actionPlan: actionPlan.length > 0 ? actionPlan : mockAnalysisReport.actionPlan,
    hasMockContent: !hasStructuredData,
  };
};
