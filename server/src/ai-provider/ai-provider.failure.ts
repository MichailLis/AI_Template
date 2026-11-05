import { HttpException } from '@nestjs/common';
import OpenAI from 'openai';
import { ZodError } from 'zod';

import { isRecord } from '../common/type-guards';

/**
 * Почему обращение к провайдеру ИИ не удалось. Код, а не текст провайдера: он идёт в лог, в запись
 * анализа и в «Проверку связи», где текст провайдера может содержать лишнее.
 */
export const AI_FAILURE_REASONS = [
  'TIMEOUT',
  'NETWORK',
  'RATE_LIMITED',
  'PROVIDER_ERROR',
  'AUTH',
  'PAYMENT',
  'MODEL_UNAVAILABLE',
  'BAD_REQUEST',
  'NOT_CONFIGURED',
  'INVALID_RESPONSE',
  'UNKNOWN',
] as const;

export type AiFailureReason = (typeof AI_FAILURE_REASONS)[number];

export interface AiFailure {
  reason: AiFailureReason;
  /** HTTP-статус ответа провайдера, если он был. */
  httpStatus?: number;
  /** Поможет ли повтор без вмешательства человека: сбой провайдера проходит сам, ключ и баланс — нет. */
  retryable: boolean;
}

/** Только временные причины: сеть, перегрузка, недоступность. Ключ, баланс и ответ не по схеме сами не пройдут. */
const RETRYABLE_REASONS: ReadonlySet<AiFailureReason> = new Set([
  'TIMEOUT',
  'NETWORK',
  'RATE_LIMITED',
  'PROVIDER_ERROR',
]);

/** Выбранной модели нет у провайдера: чинится сменой промпта, повтор не поможет. */
export class AiModelUnavailableError extends Error {}

const NOT_CONFIGURED_CODES = new Set([
  'AI_PROVIDER_NOT_CONFIGURED',
  'AI_PROVIDER_MISCONFIGURED',
  'AI_PROVIDER_BASE_URL_REQUIRED',
]);
const INVALID_RESPONSE_CODES = new Set(['AI_PROVIDER_EMPTY_RESPONSE']);

const getHttpErrorCode = (error: unknown) => {
  if (!(error instanceof HttpException)) {
    return null;
  }

  const body = error.getResponse();

  return isRecord(body) && typeof body.error === 'string' ? body.error : null;
};

const toFailure = (reason: AiFailureReason, httpStatus?: number): AiFailure => ({
  reason,
  ...(httpStatus === undefined ? {} : { httpStatus }),
  retryable: RETRYABLE_REASONS.has(reason),
});

const classifyHttpStatus = (status: number): AiFailureReason => {
  if (status === 401 || status === 403) {
    return 'AUTH';
  }
  if (status === 402) {
    return 'PAYMENT';
  }
  if (status === 404) {
    return 'MODEL_UNAVAILABLE';
  }
  if (status === 408) {
    return 'TIMEOUT';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }

  return status >= 500 ? 'PROVIDER_ERROR' : 'BAD_REQUEST';
};

/**
 * Находит ошибку SDK: клиент заворачивает её в `BadGatewayException` и кладёт оригинал в `cause`,
 * поэтому HTTP-статус виден и после обёртки.
 */
const findSdkError = (error: unknown) => {
  if (error instanceof OpenAI.APIError) {
    return error;
  }

  return error instanceof Error && error.cause instanceof OpenAI.APIError ? error.cause : null;
};

export const classifyAiFailure = (error: unknown): AiFailure => {
  if (error instanceof AiModelUnavailableError) {
    return toFailure('MODEL_UNAVAILABLE');
  }

  const code = getHttpErrorCode(error);

  if (code === 'AI_PROVIDER_TIMEOUT') {
    return toFailure('TIMEOUT');
  }

  const sdkError = findSdkError(error);

  if (sdkError) {
    if (sdkError instanceof OpenAI.APIConnectionTimeoutError) {
      return toFailure('TIMEOUT');
    }

    // Без статуса ответа нет: соединение оборвалось до него.
    return typeof sdkError.status === 'number'
      ? toFailure(classifyHttpStatus(sdkError.status), sdkError.status)
      : toFailure('NETWORK');
  }

  if (code && NOT_CONFIGURED_CODES.has(code)) {
    return toFailure('NOT_CONFIGURED');
  }

  if (
    (code && INVALID_RESPONSE_CODES.has(code)) ||
    error instanceof SyntaxError ||
    error instanceof ZodError
  ) {
    return toFailure('INVALID_RESPONSE');
  }

  return toFailure('UNKNOWN');
};
