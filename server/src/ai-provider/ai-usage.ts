import type { AiUsagePurpose, AiUsageStatus } from '@prisma/client';

import { isRecord } from '../common/type-guards';
import type { AiFailureReason } from './ai-provider.failure';

/** Виды вызовов провайдера ИИ, по которым считаются расходы. Совпадает с enum `AiUsagePurpose`. */
export const AI_USAGE_PURPOSES = [
  'STUDENT_ANALYSIS',
  'PROF_ORIENTATION_ENRICHMENT',
  'TEST_GENERATION',
  'PROMPT_SIMULATION',
  'CONNECTION_CHECK',
] as const satisfies readonly AiUsagePurpose[];

/** Кто и зачем вызывает провайдера. Клиент провайдера требует его у каждого вызова. */
export interface AiUsageContext {
  purpose: AiUsagePurpose;
  /** Попытка, ради которой сделан вызов; у вызовов из админки её нет. */
  attemptId?: number;
  actorUserId?: number;
}

/** То, что провайдер сообщил о ответе. Поле отсутствует, если провайдер его не прислал. */
export interface AiCompletionUsage {
  /** Модель из ответа: провайдер мог подменить запрошенную. */
  actualModel?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  /** `usage.cost` как есть, в единицах счёта провайдера. */
  cost?: number;
}

export interface AiUsageRecordInput extends AiUsageContext, AiCompletionUsage {
  status: AiUsageStatus;
  provider: string;
  requestedModel: string;
  durationMs: number;
  failureReason?: AiFailureReason;
}

const INT32_MAX = 2_147_483_647;
// Предел колонки Decimal(18, 8): значение за ним не запишется, а потеряет только это поле.
const COST_MAX = 1e10;

const toCount = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= INT32_MAX
    ? value
    : undefined;

const toCost = (value: unknown) =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < COST_MAX
    ? value
    : undefined;

/**
 * Читает `model` и `usage` из ответа Chat Completions. `prompt_tokens`, `completion_tokens` и
 * `total_tokens` есть в стандарте OpenAI; `usage.cost` — расширение OpenRouter и Polza, у других
 * OpenAI-совместимых сервисов его нет, и тогда стоимость остаётся пустой, а не нулём.
 */
export const readCompletionUsage = (completion: unknown): AiCompletionUsage => {
  if (!isRecord(completion)) {
    return {};
  }

  const usage = isRecord(completion.usage) ? completion.usage : {};
  const promptTokens = toCount(usage.prompt_tokens);
  const completionTokens = toCount(usage.completion_tokens);
  const totalTokens =
    toCount(usage.total_tokens) ??
    (promptTokens !== undefined && completionTokens !== undefined
      ? toCount(promptTokens + completionTokens)
      : undefined);

  return {
    actualModel:
      typeof completion.model === 'string' && completion.model ? completion.model : undefined,
    promptTokens,
    completionTokens,
    totalTokens,
    cost: toCost(usage.cost),
  };
};
