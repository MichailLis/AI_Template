export interface ProfOrientationLlmState {
  status: string;
  analysis: unknown | null;
  errorMessage: string | null;
}

export interface ProfOrientationMethodologyEnrichment {
  professorSummary: string | null;
  summary: string;
  confidenceComment: string;
  methodSignals: string[];
  firstSteps: string[];
  learningPlan: string[];
  professionNotes: string[];
  nextMiniProject: string;
  cautions: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const getProfOrientationLlmStatus = (summary: unknown) => {
  if (!isRecord(summary) || summary.resultKind !== 'prof_orientation_v3_plus') {
    return null;
  }

  const llm = isRecord(summary.llm) ? summary.llm : null;
  return typeof llm?.status === 'string' ? llm.status : 'not_requested';
};

const internalTermReplacements = [
  ['single_profile', 'ведущего направления'],
  ['mixed_profile', 'смешанный профиль'],
  ['broad_interest', 'широкий интерес'],
  ['low_definition', 'пока не определенный интерес'],
  ['primaryDirection', 'ведущее направление'],
  ['topDirections', 'близкие направления'],
  ['consistencyIndex', 'устойчивость выборов'],
  ['readinessTop', 'готовность к направлению'],
  ['selectedCounts', 'количество выборов'],
  ['sliderValues', 'оценки по шкалам'],
] as const;

const sanitizeMethodologyText = (text: string) => {
  let sanitizedText = text;

  for (const [technicalTerm, readableTerm] of internalTermReplacements) {
    sanitizedText = sanitizedText.replaceAll(technicalTerm, readableTerm);
  }

  return sanitizedText
    .replace(/\bQ\d+_[A-Z]\d\b/gu, 'выбор')
    .replace(/\bS_[A-Z]\d\b/gu, 'шкала интереса')
    .replace(/\bR_[A-Z_]+\b/gu, 'шкала готовности')
    .replace(/\b[A-Z]\d\b\s*[—-]\s*/gu, '')
    .replace(/\b[A-Z]\d\b/gu, 'направление')
    .replace(/\bgap\s*\d+(?:[.,]\d+)?/giu, 'отрыв по баллам')
    .replace(/\blabel\s*/giu, '')
    .replace(/\((?:выбор,?\s*){2,}\)/gu, '')
    .replace(/отрыв по баллам,\s*высокая,\s*/giu, 'отрыв по баллам высокий, ')
    .replace(/устойчивость выборов\s*1/giu, 'выборы были устойчивыми')
    .replace(/по направление/giu, 'по ведущему направлению')
    .replace(/\s+([,.)])/gu, '$1')
    .replace(/\s{2,}/gu, ' ')
    .trim()
    .replace(/^[:;,\-–—]\s*/u, '')
    .trim();
};

const getString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];

  return typeof value === 'string' && value.trim() ? sanitizeMethodologyText(value.trim()) : null;
};

const getProfessorSummary = (record: Record<string, unknown>) => {
  const value = getString(record, 'professorSummary');

  return value && value.length >= 24 ? value : null;
};

const getStringArray = (record: Record<string, unknown>, key: string, maxItems: number) => {
  const value = record[key];

  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => sanitizeMethodologyText(item.trim()))
    .slice(0, maxItems);
};

export const parseProfOrientationMethodologyEnrichment = (
  value: unknown,
): ProfOrientationMethodologyEnrichment | null => {
  if (!isRecord(value)) {
    return null;
  }

  const summary = getString(value, 'summary');
  const professorSummary = getProfessorSummary(value);
  const confidenceComment = getString(value, 'confidenceComment');
  const nextMiniProject = getString(value, 'nextMiniProject');
  const methodSignals = getStringArray(value, 'methodSignals', 5);
  const firstSteps = getStringArray(value, 'firstSteps', 5);
  const learningPlan = getStringArray(value, 'learningPlan', 5);
  const professionNotes = getStringArray(value, 'professionNotes', 4);
  const cautions = getStringArray(value, 'cautions', 3);

  if (
    !summary ||
    !confidenceComment ||
    !nextMiniProject ||
    methodSignals.length === 0 ||
    firstSteps.length === 0 ||
    learningPlan.length === 0
  ) {
    return null;
  }

  return {
    professorSummary,
    summary,
    confidenceComment,
    methodSignals,
    firstSteps,
    learningPlan,
    professionNotes,
    nextMiniProject,
    cautions,
  };
};
