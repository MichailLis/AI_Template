import {
  TestAnalysisResultJsonSchema,
  TestAnalysisResultSchema,
} from '../../common/analysis/test-analysis-result.contract';
import { buildAttemptAnalysisPrompt } from '../analysis/analysis-prompt-text';
import { toPublicAiAnalysisSummary } from './default-public-summary';
import type { ScoringMethodology } from './scoring-methodology';

/** Обычный тест: без алгоритмической фазы, весь результат — ответ LLM по версии промпта. */
export const defaultMethodology: ScoringMethodology = {
  kind: 'DEFAULT',
  resultKind: 'ai_analysis',
  // Запасной вариант: реестр спрашивает его последним.
  isSummary: () => true,
  llmStatus: () => null,
  enrichment: {
    purpose: 'STUDENT_ANALYSIS',
    jsonSchema: TestAnalysisResultJsonSchema,
    buildPrompt: ({ prompt, questions, answers }) =>
      buildAttemptAnalysisPrompt({ prompt, questions, answers }),
    parse: (raw) => TestAnalysisResultSchema.parse(raw),
  },
  toPublic: toPublicAiAnalysisSummary,
};
