import { isRecord } from '@/shared/lib/type-guards';

export interface ProfOrientationMethodologyEnrichment {
  professorSummary: string | null;
  summary: string;
  firstSteps: string[];
  learningPlan: string[];
  professionNotes: string[];
  nextMiniProject: string;
}

export const getProfOrientationLlmStatus = (summary: unknown) => {
  if (!isRecord(summary) || summary.resultKind !== 'prof_orientation_v3_plus') {
    return null;
  }

  const llm = isRecord(summary.llm) ? summary.llm : null;

  const status = llm?.status;

  if (
    status === 'not_requested' ||
    status === 'pending' ||
    status === 'ready' ||
    status === 'failed'
  ) {
    return status;
  }

  return 'not_requested';
};
