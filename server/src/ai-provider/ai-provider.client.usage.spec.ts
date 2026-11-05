import type { ConfigService } from '@nestjs/config';

import { AiProviderClientService, AI_PROVIDER_RETRY_DELAYS_MS } from './ai-provider.client';
import { TEST_AI_PROVIDER_CONNECTION } from './spec-fixtures';
import type { AiUsageRecordInput } from './ai-usage';
import type { AiUsageService } from './ai-usage.service';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const completionBody = (overrides: Record<string, unknown> = {}) => ({
  id: 'cmpl-1',
  object: 'chat.completion',
  created: 0,
  model: 'provider/actual-model',
  choices: [
    { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '{"ok":true}' } },
  ],
  ...overrides,
});

const request = { model: 'provider/requested-model', prompt: 'SECRET STUDENT ANSWERS' };
const usage = { purpose: 'STUDENT_ANALYSIS', attemptId: 42 } as const;

describe('ai provider client usage accounting', () => {
  const record = jest.fn<Promise<void>, [AiUsageRecordInput]>().mockResolvedValue(undefined);
  const client = new AiProviderClientService(
    { get: jest.fn() } as unknown as ConfigService,
    { record } as unknown as AiUsageService,
  );

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    record.mockClear();
  });

  it('records tokens, cost, actual model and the purpose of a successful call', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse(
        completionBody({
          usage: {
            prompt_tokens: 15_726,
            completion_tokens: 2_834,
            total_tokens: 18_560,
            cost: 0.115,
          },
        }),
      ),
    );

    await client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage });

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'STUDENT_ANALYSIS',
        attemptId: 42,
        status: 'SUCCESS',
        provider: 'polza',
        requestedModel: 'provider/requested-model',
        actualModel: 'provider/actual-model',
        promptTokens: 15_726,
        completionTokens: 2_834,
        totalTokens: 18_560,
        cost: 0.115,
      }),
    );
    expect(record.mock.calls[0][0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('records a call without cost as an empty cost, not zero', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        jsonResponse(completionBody({ usage: { prompt_tokens: 10, completion_tokens: 5 } })),
      );

    await client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage });

    const event = record.mock.calls[0][0];
    expect(event).toMatchObject({ status: 'SUCCESS', promptTokens: 10, completionTokens: 5 });
    expect(event.totalTokens).toBe(15);
    expect(event.cost).toBeUndefined();
  });

  it('records a call whose response has no usage at all', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(completionBody()));

    await client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage });

    expect(record.mock.calls[0][0]).toMatchObject({
      status: 'SUCCESS',
      actualModel: 'provider/actual-model',
    });
    expect(record.mock.calls[0][0].promptTokens).toBeUndefined();
    expect(record.mock.calls[0][0].cost).toBeUndefined();
  });

  it('records a refused call as failed with the reason code and rethrows the original error', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse({ error: { message: 'Bad key' } }, 401));

    await expect(
      client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage }),
    ).rejects.toThrow('Bad key');

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        failureReason: 'AUTH',
        requestedModel: 'provider/requested-model',
        attemptId: 42,
      }),
    );
    expect(record.mock.calls[0][0].promptTokens).toBeUndefined();
  });

  it('records a timeout as failed: a call the provider may still bill', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );

    await expect(
      client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { timeoutMs: 20, usage }),
    ).rejects.toThrow();

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'FAILED', failureReason: 'TIMEOUT' }),
    );
  });

  it('keeps the tokens and cost of an empty response: the provider billed it', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse(
        completionBody({
          choices: [
            { index: 0, finish_reason: 'length', message: { role: 'assistant', content: '' } },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 4_000, cost: 0.2 },
        }),
      ),
    );

    await expect(
      client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage }),
    ).rejects.toThrow('returned an empty response');

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'FAILED',
        failureReason: 'INVALID_RESPONSE',
        promptTokens: 100,
        completionTokens: 4_000,
        cost: 0.2,
      }),
    );
  });

  it('writes one event for a call the client retried after a 429', async () => {
    jest.useFakeTimers();
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(jsonResponse({ error: { message: 'Too many requests' } }, 429))
      .mockResolvedValueOnce(
        jsonResponse(completionBody({ usage: { prompt_tokens: 1, cost: 0.01 } })),
      );

    const pending = client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage });
    await jest.advanceTimersByTimeAsync(AI_PROVIDER_RETRY_DELAYS_MS[0]);
    await pending;

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUCCESS', cost: 0.01 }));
  });

  it('never hands the prompt or the answer to the usage record', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(jsonResponse(completionBody()));

    await client.generatePrompt(TEST_AI_PROVIDER_CONNECTION, request, { usage });

    const serialized = JSON.stringify(record.mock.calls);
    expect(serialized).not.toContain('SECRET STUDENT ANSWERS');
    expect(serialized).not.toContain('{\\"ok\\":true}');
  });

  it('records the connection check as its own purpose with the admin who pressed the button', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        jsonResponse(
          completionBody({ usage: { prompt_tokens: 3, completion_tokens: 1, cost: 0.0001 } }),
        ),
      );

    await client.checkCompletion({ ...TEST_AI_PROVIDER_CONNECTION, defaultModel: 'm-1' }, 7);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'CONNECTION_CHECK',
        actorUserId: 7,
        status: 'SUCCESS',
        requestedModel: 'm-1',
        cost: 0.0001,
      }),
    );
  });

  it('records a failed connection check with its reason', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse({ error: { message: 'No money' } }, 402));

    await client.checkCompletion({ ...TEST_AI_PROVIDER_CONNECTION, defaultModel: 'm-1' }, 7);

    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        purpose: 'CONNECTION_CHECK',
        status: 'FAILED',
        failureReason: 'PAYMENT',
      }),
    );
  });
});
