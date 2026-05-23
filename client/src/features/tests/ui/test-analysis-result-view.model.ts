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
  READY: 'анализ готов',
  PENDING: 'анализ выполняется',
  FAILED: 'ошибка анализа',
};
