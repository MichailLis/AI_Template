import type { ConfigService } from '@nestjs/config';

import { OpenRouterClientService } from './openrouter.client';

describe('openrouter client', () => {
  const createClient = (value: string | number | undefined) =>
    new OpenRouterClientService({
      get: jest.fn().mockReturnValue(value),
    } as unknown as ConfigService);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses configured OpenRouter timeout when it is a positive number', () => {
    expect(createClient('180000').resolveTimeoutMs()).toBe(180_000);
    expect(createClient(90_000).resolveTimeoutMs()).toBe(90_000);
  });

  it('uses request timeout override before global OpenRouter timeout', () => {
    expect(createClient('120000').resolveTimeoutMs(180_000)).toBe(180_000);
  });

  it('falls back to a longer default timeout for structured analysis requests', () => {
    expect(createClient(undefined).resolveTimeoutMs()).toBe(120_000);
    expect(createClient('not-a-number').resolveTimeoutMs()).toBe(120_000);
    expect(createClient('-1').resolveTimeoutMs()).toBe(120_000);
  });

  /**
   * Находка аудита UX-02: бейдж «OpenRouter готов» считался по наличию ключа. Проверка связи
   * обязана реально сходить в OpenRouter и честно сообщить об отказе.
   */
  it('reports a healthy connection when the model catalog loads', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockResolvedValue({ defaultModel: 'm', models: [] });

    const health = await client.checkHealth('test-key');

    expect(fetchModelsSpy).toHaveBeenCalledWith('test-key', { timeoutMs: 5000 });
    expect(health.status).toBe('ok');
    expect(health.errorMessage).toBeUndefined();
    expect(Number.isNaN(Date.parse(health.checkedAt))).toBe(false);
  });

  it('caches the health check result and avoids repeated calls within TTL', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockResolvedValue({ defaultModel: 'm', models: [] });

    const first = await client.checkHealth('test-key');
    const second = await client.checkHealth('test-key');

    expect(fetchModelsSpy).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('reports a failed connection with the reason instead of throwing', async () => {
    const client = createClient(undefined);
    jest.spyOn(client, 'fetchModels').mockRejectedValue(new Error('User not found.'));

    await expect(client.checkHealth('bad-key')).resolves.toMatchObject({
      status: 'failed',
      errorMessage: 'User not found.',
    });
  });

  it('rechecks the provider immediately after a failed health check', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockRejectedValueOnce(new Error('Temporary outage'))
      .mockResolvedValueOnce({ defaultModel: 'm', models: [] });

    await expect(client.checkHealth('test-key')).resolves.toMatchObject({ status: 'failed' });
    await expect(client.checkHealth('test-key')).resolves.toMatchObject({ status: 'ok' });
    expect(fetchModelsSpy).toHaveBeenCalledTimes(2);
  });

  it('passes provider preferences together with required structured parameters', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
        { status: 200 },
      ),
    );

    await createClient(undefined).generatePrompt('test-key', {
      model: 'deepseek/deepseek-v4-flash',
      prompt: 'Return JSON',
      responseFormat: 'json',
      responseSchema: { schema: { type: 'object', additionalProperties: true } },
      provider: {
        order: ['cloudflare', 'baidu'],
        allow_fallbacks: true,
      },
    });

    const requestBody = fetchMock.mock.calls[0]?.[1]?.body;

    if (typeof requestBody !== 'string') {
      throw new Error('Expected OpenRouter request body to be serialized JSON');
    }

    const body = JSON.parse(requestBody) as { provider?: unknown };

    expect(body.provider).toEqual({
      require_parameters: true,
      order: ['cloudflare', 'baidu'],
      allow_fallbacks: true,
    });
  });

  it('returns the serving provider and usage from the OpenRouter response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true}' } }],
          provider: 'StreamLake',
          usage: {
            prompt_tokens: 15200,
            completion_tokens: 900,
            completion_tokens_details: { reasoning_tokens: 0 },
            cost: 0.0004,
          },
        }),
        { status: 200 },
      ),
    );

    const result = await createClient(undefined).generatePrompt('test-key', {
      model: 'deepseek/deepseek-v4-flash',
      prompt: 'Return JSON',
      responseFormat: 'json',
      responseSchema: { schema: { type: 'object', additionalProperties: true } },
    });

    expect(result.provider).toBe('StreamLake');
    expect(result.usage).toEqual({
      prompt_tokens: 15200,
      completion_tokens: 900,
      completion_tokens_details: { reasoning_tokens: 0 },
      cost: 0.0004,
    });
  });

  it('passes the preferred minimum throughput threshold through to the request', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"ok":true}' } }],
        }),
        { status: 200 },
      ),
    );

    await createClient(undefined).generatePrompt('test-key', {
      model: 'deepseek/deepseek-v4-flash',
      prompt: 'Return JSON',
      responseFormat: 'json',
      responseSchema: { schema: { type: 'object', additionalProperties: true } },
      provider: {
        preferred_min_throughput: { p50: 50 },
        ignore: ['cloudflare'],
      },
    });

    const requestBody = fetchMock.mock.calls[0]?.[1]?.body;

    if (typeof requestBody !== 'string') {
      throw new Error('Expected OpenRouter request body to be serialized JSON');
    }

    const body = JSON.parse(requestBody) as { provider?: unknown };

    expect(body.provider).toEqual({
      require_parameters: true,
      preferred_min_throughput: { p50: 50 },
      ignore: ['cloudflare'],
    });
  });

  it('sends sessionId as session_id and omits it when not provided', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ choices: [{ message: { content: '{"ok":true}' } }] }), {
          status: 200,
        }),
      ),
    );
    const client = createClient(undefined);

    await client.generatePrompt('test-key', {
      model: 'deepseek/deepseek-v4-flash',
      prompt: 'Return JSON',
      sessionId: 'prof-orientation-5-try-1',
    });
    await client.generatePrompt('test-key', {
      model: 'deepseek/deepseek-v4-flash',
      prompt: 'Return JSON',
    });

    const bodies = fetchMock.mock.calls.map((call) => {
      const rawBody = call[1]?.body;

      if (typeof rawBody !== 'string') {
        throw new Error('Expected OpenRouter request body to be serialized JSON');
      }

      return JSON.parse(rawBody) as object;
    });

    expect(bodies[0]).toMatchObject({ session_id: 'prof-orientation-5-try-1' });
    expect(bodies[1]).not.toHaveProperty('session_id');
  });
});
