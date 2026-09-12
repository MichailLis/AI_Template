import { getProfOrientationLlmStatus } from '../prof-orientation-v3-plus/scoring';

/**
 * Что на самом деле лежит в записи анализа. Статус `READY` этого не говорит: у заглушки он такой
 * же, как у настоящего ИИ-анализа, а у двухфазного prof-orientation запись становится `READY`
 * после алгоритмической фазы, ещё до ИИ. Поэтому источник истины — `providerMode` плюс
 * `summary.llm.status`, а не `status`.
 */
export const ANALYSIS_RESULT_KINDS = [
  'AI',
  'ALGORITHM_AI_PENDING',
  'ALGORITHM_ONLY',
  'STUB',
  'PENDING',
  'FAILED',
  'MISSING',
] as const;

export type AnalysisResultKind = (typeof ANALYSIS_RESULT_KINDS)[number];

type AnalysisResultState = {
  providerMode: string;
  status: string;
  summary?: unknown;
};

export const getAnalysisResultKind = (
  analysis: AnalysisResultState | null | undefined,
): AnalysisResultKind => {
  if (!analysis) {
    return 'MISSING';
  }

  if (analysis.status === 'PENDING') {
    return 'PENDING';
  }

  if (analysis.status === 'FAILED') {
    return 'FAILED';
  }

  if (analysis.providerMode === 'STUB') {
    return 'STUB';
  }

  if (analysis.providerMode === 'LLM') {
    return 'AI';
  }

  if (analysis.providerMode === 'ALGORITHM_LLM') {
    const llmStatus = getProfOrientationLlmStatus(analysis.summary);

    if (llmStatus === 'ready') {
      return 'AI';
    }

    if (llmStatus === 'pending') {
      return 'ALGORITHM_AI_PENDING';
    }

    return 'ALGORITHM_ONLY';
  }

  /**
   * `ALGORITHM` и всё, что не распознано: результат есть, но приписать его ИИ нельзя. Ошибаться
   * здесь нужно в сторону «без ИИ» — именно завышенная оценка готовности и была находкой аудита.
   */
  return 'ALGORITHM_ONLY';
};

/**
 * Содержательный результат — тот, который админ вправе считать готовым анализом. Заглушка,
 * ожидание и отказ сюда не входят: именно их подсчёт как готовых и создавал ложные 100%.
 */
export const isMeaningfulAnalysisResult = (kind: AnalysisResultKind) =>
  kind === 'AI' || kind === 'ALGORITHM_AI_PENDING' || kind === 'ALGORITHM_ONLY';

/**
 * Результат есть, но содержания от ИИ в нём нет — отдельная цифра «без ИИ» в показателях.
 */
export const isAnalysisResultWithoutAi = (kind: AnalysisResultKind) =>
  kind === 'ALGORITHM_AI_PENDING' || kind === 'ALGORITHM_ONLY';
