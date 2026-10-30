import type { AnalysisPayload } from '../lib/test-analysis-result-parser';

export interface TestAnalysisResultViewProps {
  analysis: AnalysisPayload | null;
  className?: string;
  showRawText?: boolean;
  showProviderBadge?: boolean;
  showErrorDetails?: boolean;
  showStructuredFallback?: boolean;
  generatedAtLabel?: string;
}

export const levelLabels = {
  low: 'начальный',
  medium: 'средний',
  high: 'сильный',
} as const;

export const statusLabels: Record<string, string> = {
  READY: 'Анализ готов',
  PENDING: 'Анализ выполняется',
  FAILED: 'Ошибка анализа',
};

/**
 * Режим формирования анализа приходит с сервера как enum и раньше показывался как есть — рядом с
 * русскими бейджами в карточке прохождения висело латинское `STUB`.
 */
export const providerModeLabels: Record<string, string> = {
  STUB: 'Заглушка',
  LLM: 'Модель',
  ALGORITHM: 'Алгоритм',
  ALGORITHM_LLM: 'Алгоритм и модель',
};
