import type { AiUsagePurpose, TestScoringKind } from '@prisma/client';

import type { AiPromptRequest } from '../../ai-provider/ai-provider.client';
import type { AttemptWithSessionData } from '../attempts/attempt.query';
import type { PublicAnalysisSummary } from '../dto/tests-public-result.dto';
import type { MethodologyAnalyticsSections } from '../reporting/analytics.types';
import type { PersistQuestionPayload } from '../topics/topic-version.utils';
import type { MethodologyServices } from './methodology-services';

export type AnalysisLlmStatus = 'not_requested' | 'pending' | 'ready' | 'failed';

/**
 * LLM-фаза методики. У обычного теста это весь анализ, у методики с алгоритмической фазой
 * (`score`) — обогащение, которое дописывается в `summary.llm`.
 */
export interface MethodologyEnrichment {
  purpose: AiUsagePurpose;
  jsonSchema: NonNullable<AiPromptRequest['responseSchema']>;
  buildPrompt(input: {
    prompt: string;
    /** Результат алгоритмической фазы; у методики без неё — `null`. */
    summary: unknown;
    questions: unknown[];
    answers: unknown[];
  }): string;
  /** Разбор и проверка ответа модели; бросает, если ответ непригоден. */
  parse(raw: unknown): unknown;
  /** Маршрутизация OpenRouter. */
  provider?: AiPromptRequest['provider'];
  /** Префикс `session_id`: вместе с номером попытки снимает привязку запросов к одному провайдеру. */
  sessionIdPrefix?: string;
  /** Таймаут запроса: имена переменных окружения по порядку и значение по умолчанию. */
  timeoutMs?: { envKeys: readonly string[]; fallback: number };
  /** Повторы при таймауте провайдера. */
  timeoutRetries?: { envKeys: readonly string[]; fallback: number; max: number };
}

/** Шаблон теста, который админ импортирует одной кнопкой. */
export interface MethodologyImportTemplate {
  slug: string;
  title: string;
  description: string;
  scoringConfig: unknown;
  buildQuestions(): PersistQuestionPayload[];
  prompt: { title: string; description: string; model: string; text: string };
}

export interface ScoringMethodology {
  kind: TestScoringKind;
  /** Дискриминант публичного `summary`. */
  resultKind: string;
  /** Узнаёт сохранённый `summary` этой методики. У `DEFAULT` признака нет: это запасной вариант. */
  isSummary(value: unknown): boolean;
  /** Сигнал завершения ИИ-фазы; `null`, если у методики нет алгоритмической фазы. */
  llmStatus(summary: unknown): AnalysisLlmStatus | null;
  /** Алгоритмическая фаза. Нет у методик, где весь результат — ответ LLM. */
  score?(input: { attempt: AttemptWithSessionData; llmRequested: boolean }): unknown;
  enrichment: MethodologyEnrichment;
  /** Дозаполнение результата после алгоритмической фазы (атлас профессий) — вне транзакции. */
  afterFinish?: {
    isStale(summary: unknown): boolean;
    apply(analysisId: number, summary: unknown, services: MethodologyServices): Promise<unknown>;
  };
  /** Белый список полей для ученика; `null` — показывать нечего. */
  toPublic(stored: unknown): PublicAnalysisSummary | null;
  /** Краткая строка результата в списке попыток админки. */
  listSummary?(
    stored: unknown,
  ): { primaryDirectionLabel: string | null; profileTitle: string | null } | null;
  analytics?: {
    /**
     * Лёгкая проекция сохранённого `summary` для разделов аналитики; `null` — запись не
     * результат этой методики. Сервис читает `summary` пачками и держит в памяти только проекции.
     */
    toFacts(summary: unknown): unknown;
    buildSections(facts: readonly unknown[], scoringConfig?: unknown): MethodologyAnalyticsSections;
  };
  importTemplate?: MethodologyImportTemplate;
}
