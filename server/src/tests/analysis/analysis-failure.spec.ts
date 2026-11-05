import { BadGatewayException } from '@nestjs/common';
import OpenAI from 'openai';

import {
  AUTO_RETRY_DELAYS_MS,
  buildAnalysisFailure,
  describeAnalysisFailure,
  readAutoRetries,
  readNextRetryAtMs,
} from './analysis-failure';

const NOW = new Date('2026-05-12T12:00:00.000Z');
const MINUTE = 60_000;

const providerFailure = (status: number, message = 'secret provider text') =>
  new BadGatewayException(message, {
    cause: OpenAI.APIError.generate(status, { error: { message } }, message, new Headers()),
    description: 'AI_PROVIDER_REQUEST_FAILED',
  });

/** Summary as the claim leaves it before the Nth automatic retry runs. */
const pendingAfter = (autoRetries: number) => ({ llm: { status: 'pending', autoRetries } });

describe('automatic retry policy', () => {
  it('allows three retries with a growing pause: 10, 30 and 90 minutes', () => {
    expect(AUTO_RETRY_DELAYS_MS.map((delay) => delay / MINUTE)).toEqual([10, 30, 90]);
  });

  it('schedules the first retry ten minutes after a provider outage', () => {
    const { state } = buildAnalysisFailure(providerFailure(503), null, NOW);

    expect(state).toEqual({
      reason: 'PROVIDER_ERROR',
      httpStatus: 503,
      failedAt: NOW.toISOString(),
      autoRetries: 0,
      nextRetryAtMs: NOW.getTime() + 10 * MINUTE,
    });
  });

  it('lengthens the pause with every retry that fails again', () => {
    const pauses = [0, 1, 2].map((done) => {
      const { state } = buildAnalysisFailure(providerFailure(503), pendingAfter(done), NOW);

      return (state.nextRetryAtMs ?? NaN) - NOW.getTime();
    });

    expect(pauses).toEqual([10 * MINUTE, 30 * MINUTE, 90 * MINUTE]);
  });

  it('stops after the third retry: the budget is spent and no further time is set', () => {
    const { state } = buildAnalysisFailure(providerFailure(503), pendingAfter(3), NOW);

    expect(state.autoRetries).toBe(3);
    expect(state).not.toHaveProperty('nextRetryAtMs');
  });

  it.each([
    ['a revoked key', 401],
    ['an empty balance', 402],
    ['a rejected request', 400],
    ['an unknown model', 404],
  ])('does not retry %s: only a person can fix it', (_name, status) => {
    const { failure, state } = buildAnalysisFailure(providerFailure(status), null, NOW);

    expect(failure.retryable).toBe(false);
    expect(state).not.toHaveProperty('nextRetryAtMs');
  });

  it('does not retry an invalid answer, however transient the call looked', () => {
    const { state } = buildAnalysisFailure(new SyntaxError('Unexpected token'), null, NOW);

    expect(state.reason).toBe('INVALID_RESPONSE');
    expect(state).not.toHaveProperty('nextRetryAtMs');
  });

  it('retries rate limits, timeouts and dropped connections', () => {
    const timeout = new BadGatewayException('t', {
      cause: new OpenAI.APIConnectionTimeoutError(),
      description: 'AI_PROVIDER_TIMEOUT',
    });

    expect(buildAnalysisFailure(providerFailure(429), null, NOW).state.reason).toBe('RATE_LIMITED');
    expect(buildAnalysisFailure(timeout, null, NOW).state.reason).toBe('TIMEOUT');
    expect(
      buildAnalysisFailure(new OpenAI.APIConnectionError({ message: 'x' }), null, NOW).state
        .nextRetryAtMs,
    ).toBe(NOW.getTime() + 10 * MINUTE);
  });

  it('reads the counter and the deadline only from numbers in summary.llm', () => {
    expect(readAutoRetries(pendingAfter(2))).toBe(2);
    expect(readAutoRetries(null)).toBe(0);
    expect(readAutoRetries({ llm: { autoRetries: '2' } })).toBe(0);
    expect(readAutoRetries({ llm: { autoRetries: -1 } })).toBe(0);
    expect(readNextRetryAtMs({ llm: { nextRetryAtMs: 5 } })).toBe(5);
    expect(readNextRetryAtMs({ llm: { nextRetryAtMs: null } })).toBeNull();
    expect(readNextRetryAtMs({})).toBeNull();
  });

  it('describes a failure for the log by code and counters, never by provider text', () => {
    const { state } = buildAnalysisFailure(
      providerFailure(401, 'Incorrect API key provided: sk-live-123'),
      null,
      NOW,
    );
    const line = describeAnalysisFailure(state);

    expect(line).toBe('reason=AUTH http=401 autoRetries=0/3 nextRetry=none');
    expect(line).not.toContain('sk-live');
  });
});
