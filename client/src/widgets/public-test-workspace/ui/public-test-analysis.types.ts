export interface AnalysisProfessionRecommendation {
  rank: number;
  title: string;
  matchScore: number;
  salary: string;
  growth: string;
  description: string;
}

export interface AnalysisTraitScore {
  key: string;
  label: string;
  value: number;
  maxValue: number;
}

export interface AnalysisActionPlanStep {
  id: string;
  title: string;
  description: string;
  timeframe: string;
}

export interface AnalysisProcessingStep {
  id: string;
  text: string;
}

export interface PublicTestAnalysisReportViewModel {
  archetypeTitle: string;
  archetypeDescription: string;
  completionRate: number | null;
  answeredQuestionsCount: number | null;
  totalQuestionsCount: number | null;
  note: string | null;
  narrative: string | null;
  professions: AnalysisProfessionRecommendation[];
  traitScores: AnalysisTraitScore[];
  actionPlan: AnalysisActionPlanStep[];
  hasMockContent: boolean;
}
