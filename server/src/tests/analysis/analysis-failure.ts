import {
  classifyAiFailure,
  type AiFailure,
  type AiFailureReason,
} from '../../ai-provider/ai-provider.failure';
import { isRecord } from '../../common/type-guards';

/**
 * Паузы перед автоповторами упавшего анализа: 10, 30 и 90 минут, всего три повтора. Повтор — это
 * платный вызов модели, поэтому лимит маленький, а пауза растёт: короткий сбой провайдера
 * проходит с первого повтора, затяжной не сжигает деньги. Фактическая пауза до 10 минут длиннее:
 * повтор берёт периодический проход восстановления.
 */
export const AUTO_RETRY_DELAYS_MS = [10 * 60_000, 30 * 60_000, 90 * 60_000] as const;

/**
 * Состояние последней неудачи. Лежит в `summary.llm` без миграции: у профориентации рядом со
 * `status: 'failed'`, у обычного ИИ-анализа — единственным содержимым `summary`, пока он `FAILED`.
 */
export type AnalysisFailureState = {
  reason: AiFailureReason;
  httpStatus?: number;
  failedAt: string;
  /** Сколько автоповторов уже сделано в этой серии; ручной перезапуск начинает серию заново. */
  autoRetries: number;
  /** Когда проход восстановления может повторить анализ; нет ключа — автоповтора не будет. */
  nextRetryAtMs?: number;
};

const readLlmField = (summary: unknown, field: string): unknown => {
  const llm = isRecord(summary) ? summary.llm : undefined;

  return isRecord(llm) ? llm[field] : undefined;
};

export const readAutoRetries = (summary: unknown) => {
  const value = readLlmField(summary, 'autoRetries');

  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 0;
};

export const readNextRetryAtMs = (summary: unknown) => {
  const value = readLlmField(summary, 'nextRetryAtMs');

  return typeof value === 'number' && Number.isFinite(value) ? value : null;
};

/**
 * Классифицирует ошибку и решает, будет ли автоповтор: только для временных сбоев провайдера и
 * пока лимит не выбран. Ключ, баланс и ответ не по схеме остаются до ручного перезапуска.
 */
export const buildAnalysisFailure = (
  error: unknown,
  previousSummary: unknown,
  now = new Date(),
): { failure: AiFailure; state: AnalysisFailureState } => {
  const failure = classifyAiFailure(error);
  const autoRetries = readAutoRetries(previousSummary);
  const delayMs: number | undefined = AUTO_RETRY_DELAYS_MS[autoRetries];

  return {
    failure,
    state: {
      reason: failure.reason,
      ...(failure.httpStatus === undefined ? {} : { httpStatus: failure.httpStatus }),
      failedAt: now.toISOString(),
      autoRetries,
      ...(failure.retryable && delayMs !== undefined
        ? { nextRetryAtMs: now.getTime() + delayMs }
        : {}),
    },
  };
};

/** Строка для лога: код причины и счётчики, без текста провайдера, ключей и промптов. */
export const describeAnalysisFailure = (state: AnalysisFailureState) =>
  [
    `reason=${state.reason}`,
    state.httpStatus === undefined ? null : `http=${state.httpStatus}`,
    `autoRetries=${state.autoRetries}/${AUTO_RETRY_DELAYS_MS.length}`,
    state.nextRetryAtMs === undefined
      ? 'nextRetry=none'
      : `nextRetry=${new Date(state.nextRetryAtMs).toISOString()}`,
  ]
    .filter(Boolean)
    .join(' ');
