import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';

import {
  AiModelUnavailableError,
  classifyAiFailure,
  type AiFailureReason,
} from './ai-provider.failure';

const sdkError = (status: number | undefined, message = 'provider said no') =>
  OpenAI.APIError.generate(status, { error: { message } }, message, new Headers());

/** Как клиент оборачивает ошибку SDK: сообщение провайдера наружу, оригинал в `cause`. */
const wrapped = (status: number | undefined, code = 'AI_PROVIDER_REQUEST_FAILED') =>
  new BadGatewayException('provider said no', { cause: sdkError(status), description: code });

describe('classifyAiFailure', () => {
  it.each<[string, number, AiFailureReason, boolean]>([
    ['429 is a rate limit that passes by itself', 429, 'RATE_LIMITED', true],
    ['500 is a provider failure', 500, 'PROVIDER_ERROR', true],
    ['502 is a provider failure', 502, 'PROVIDER_ERROR', true],
    ['503 is a provider failure', 503, 'PROVIDER_ERROR', true],
    ['504 is a provider failure', 504, 'PROVIDER_ERROR', true],
    ['408 is a timeout', 408, 'TIMEOUT', true],
    ['401 is a revoked key: waiting does not help', 401, 'AUTH', false],
    ['403 is a rejected key: waiting does not help', 403, 'AUTH', false],
    ['402 is an empty balance: waiting does not help', 402, 'PAYMENT', false],
    ['404 is an unknown model', 404, 'MODEL_UNAVAILABLE', false],
    ['400 is a request the provider rejects', 400, 'BAD_REQUEST', false],
    ['422 is a request the provider rejects', 422, 'BAD_REQUEST', false],
  ])('%s', (_name, status, reason, retryable) => {
    expect(classifyAiFailure(wrapped(status))).toEqual({
      reason,
      httpStatus: status,
      retryable,
    });
  });

  it('reads the status of a bare SDK error as well as a wrapped one', () => {
    expect(classifyAiFailure(sdkError(402))).toMatchObject({ reason: 'PAYMENT', httpStatus: 402 });
  });

  it('treats a dropped connection (no HTTP status) as a retryable network failure', () => {
    const connectionError = new OpenAI.APIConnectionError({ message: 'ECONNRESET' });

    expect(classifyAiFailure(connectionError)).toEqual({ reason: 'NETWORK', retryable: true });
    expect(
      classifyAiFailure(new BadGatewayException('x', { cause: connectionError, description: 'X' })),
    ).toEqual({ reason: 'NETWORK', retryable: true });
  });

  it('treats the client timeout as a retryable timeout', () => {
    const timeout = new BadGatewayException('AI provider request timeout', {
      cause: new OpenAI.APIConnectionTimeoutError(),
      description: 'AI_PROVIDER_TIMEOUT',
    });

    expect(classifyAiFailure(timeout)).toEqual({ reason: 'TIMEOUT', retryable: true });
    expect(classifyAiFailure(new BadGatewayException('t', 'AI_PROVIDER_TIMEOUT'))).toEqual({
      reason: 'TIMEOUT',
      retryable: true,
    });
  });

  it('never retries an answer that is not valid: empty, not JSON, not matching the schema', () => {
    const notMatching = z.object({ a: z.string() }).safeParse({ a: 1 }).error;

    expect(
      classifyAiFailure(new BadGatewayException('empty', 'AI_PROVIDER_EMPTY_RESPONSE')),
    ).toEqual({ reason: 'INVALID_RESPONSE', retryable: false });
    expect(classifyAiFailure(new SyntaxError('Unexpected token'))).toEqual({
      reason: 'INVALID_RESPONSE',
      retryable: false,
    });
    expect(classifyAiFailure(notMatching)).toEqual({
      reason: 'INVALID_RESPONSE',
      retryable: false,
    });
  });

  it('never retries a model the provider does not have or a provider that is not configured', () => {
    expect(classifyAiFailure(new AiModelUnavailableError('нет модели'))).toEqual({
      reason: 'MODEL_UNAVAILABLE',
      retryable: false,
    });
    expect(
      classifyAiFailure(new ServiceUnavailableException('no key', 'AI_PROVIDER_NOT_CONFIGURED')),
    ).toEqual({ reason: 'NOT_CONFIGURED', retryable: false });
  });

  it('does not retry what it cannot name', () => {
    expect(classifyAiFailure(new Error('boom'))).toEqual({ reason: 'UNKNOWN', retryable: false });
    expect(classifyAiFailure('boom')).toEqual({ reason: 'UNKNOWN', retryable: false });
  });
});
