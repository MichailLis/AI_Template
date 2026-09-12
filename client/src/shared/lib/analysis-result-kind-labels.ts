/**
 * Подписи к виду результата анализа. Сервер присылает `analysisResultKind` (см. серверный
 * `getAnalysisResultKind`) — правило классификации живёт только там, здесь лежит один перевод
 * на человеческий язык, чтобы одни и те же слова стояли и в таблице прохождений, и в карточке.
 *
 * Раньше интерфейс показывал `status === 'READY'` как зелёное «Анализ готов» и для заглушки, и
 * для настоящего ИИ-анализа, поэтому подписи здесь называют именно источник результата.
 */
const analysisResultKindLabels: Record<string, string> = {
  AI: 'ИИ-анализ готов',
  ALGORITHM_AI_PENDING: 'Алгоритм готов, ИИ считается',
  ALGORITHM_ONLY: 'Только алгоритм, ИИ не отработал',
  STUB: 'Заглушка, промпт не подключен',
  PENDING: 'В очереди',
  FAILED: 'Ошибка анализа',
  MISSING: 'Нет анализа',
};

export type AnalysisResultKindTone = 'success' | 'warning' | 'danger' | 'neutral';

/**
 * Зелёный цвет остаётся только за результатом, в котором действительно есть ИИ-содержание.
 */
const analysisResultKindTones: Record<string, AnalysisResultKindTone> = {
  AI: 'success',
  ALGORITHM_AI_PENDING: 'neutral',
  ALGORITHM_ONLY: 'warning',
  STUB: 'warning',
  PENDING: 'neutral',
  FAILED: 'danger',
  MISSING: 'neutral',
};

export const getAnalysisResultKindLabel = (kind: string | null | undefined) => {
  if (!kind) {
    return analysisResultKindLabels.MISSING;
  }

  return analysisResultKindLabels[kind] ?? kind;
};

export const getAnalysisResultKindTone = (
  kind: string | null | undefined,
): AnalysisResultKindTone => {
  if (!kind) {
    return 'neutral';
  }

  return analysisResultKindTones[kind] ?? 'neutral';
};
