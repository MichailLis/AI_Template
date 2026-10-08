import type { ConfigService } from '@nestjs/config';

import type { AiProviderConnection } from './ai-provider.config';
import { AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE, AiProviderClientService } from './ai-provider.client';

const polzaConnection: AiProviderConnection = {
  provider: 'polza',
  label: 'Polza.ai',
  baseUrl: 'https://polza.ai/api/v1',
  apiKey: 'test-key',
  defaultModel: null,
  supportsOpenRouterExtensions: false,
  modelsQuery: { type: 'chat' },
};

const openRouterConnection: AiProviderConnection = {
  provider: 'openrouter',
  label: 'OpenRouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: 'test-key',
  defaultModel: null,
  supportsOpenRouterExtensions: true,
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const completion = (content: string) =>
  jsonResponse({
    id: 'cmpl-1',
    object: 'chat.completion',
    created: 0,
    model: 'm',
    choices: [{ index: 0, finish_reason: 'stop', message: { role: 'assistant', content } }],
  });

const structuredRequest = {
  model: 'deepseek/deepseek-v4-flash',
  prompt: 'Return JSON',
  responseFormat: 'json' as const,
  responseSchema: { schema: { type: 'object', additionalProperties: true } },
  provider: {
    order: ['cloudflare', 'baidu'],
    allow_fallbacks: true,
  },
};

const readRequest = (fetchMock: jest.SpyInstance, index = 0) => {
  const [input, init] = fetchMock.mock.calls[index] as [RequestInfo | URL, RequestInit];
  const url = input instanceof Request ? input.url : String(input);
  const headers = new Headers(init.headers);
  const body =
    typeof init.body === 'string' ? (JSON.parse(init.body) as Record<string, unknown>) : {};

  return { url, headers, body };
};

describe('ai provider client', () => {
  const createClient = (value: string | number | undefined) =>
    new AiProviderClientService({
      get: jest.fn().mockReturnValue(value),
    } as unknown as ConfigService);

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses configured timeout when it is a positive number', () => {
    expect(createClient('180000').resolveTimeoutMs()).toBe(180_000);
    expect(createClient(90_000).resolveTimeoutMs()).toBe(90_000);
  });

  it('uses request timeout override before global timeout', () => {
    expect(createClient('120000').resolveTimeoutMs(180_000)).toBe(180_000);
  });

  it('falls back to a longer default timeout for structured analysis requests', () => {
    expect(createClient(undefined).resolveTimeoutMs()).toBe(120_000);
    expect(createClient('not-a-number').resolveTimeoutMs()).toBe(120_000);
    expect(createClient('-1').resolveTimeoutMs()).toBe(120_000);
  });

  /**
   * Находка аудита UX-02: бейдж «OpenRouter готов» считался по наличию ключа. Проверка связи
   * обязана реально сходить к провайдеру и честно сообщить об отказе.
   */
  it('reports a healthy connection when the model catalog loads', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockResolvedValue({ defaultModel: 'm', models: [] });

    const health = await client.checkHealth(polzaConnection);

    expect(fetchModelsSpy).toHaveBeenCalledWith(polzaConnection, { timeoutMs: 5000 });
    expect(health.status).toBe('ok');
    expect(health.errorMessage).toBeUndefined();
    expect(Number.isNaN(Date.parse(health.checkedAt))).toBe(false);
  });

  it('caches the health check result and avoids repeated calls within TTL', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockResolvedValue({ defaultModel: 'm', models: [] });

    const first = await client.checkHealth(polzaConnection);
    const second = await client.checkHealth(polzaConnection);

    expect(fetchModelsSpy).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
  });

  it('does not share the cached health result between providers with the same key', async () => {
    const client = createClient(undefined);
    const fetchModelsSpy = jest
      .spyOn(client, 'fetchModels')
      .mockResolvedValue({ defaultModel: 'm', models: [] });

    await client.checkHealth(polzaConnection);
    await client.checkHealth(openRouterConnection);

    expect(fetchModelsSpy).toHaveBeenCalledTimes(2);
  });

  it('reports a failed connection with the reason instead of throwing', async () => {
    const client = createClient(undefined);
    jest.spyOn(client, 'fetchModels').mockRejectedValue(new Error('User not found.'));

    await expect(client.checkHealth(polzaConnection)).resolves.toMatchObject({
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

    await expect(client.checkHealth(polzaConnection)).resolves.toMatchObject({ status: 'failed' });
    await expect(client.checkHealth(polzaConnection)).resolves.toMatchObject({ status: 'ok' });
    expect(fetchModelsSpy).toHaveBeenCalledTimes(2);
  });

  it('sends a standard Chat Completions request to the configured base URL', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(completion('{"ok":true}'));

    await expect(
      createClient(undefined).generatePrompt(polzaConnection, structuredRequest),
    ).resolves.toEqual({
      model: 'deepseek/deepseek-v4-flash',
      output: JSON.stringify({ ok: true }, null, 2),
    });

    const { url, headers, body } = readRequest(fetchMock);

    expect(url).toBe('https://polza.ai/api/v1/chat/completions');
    expect(headers.get('authorization')).toBe('Bearer test-key');
    expect(headers.get('x-title')).toBeNull();
    expect(body).toEqual({
      model: 'deepseek/deepseek-v4-flash',
      temperature: 0.7,
      messages: [{ role: 'user', content: 'Return JSON' }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          strict: true,
          schema: { type: 'object', additionalProperties: true },
        },
      },
    });
  });

  it('passes OpenRouter routing, required parameters and response healing only to OpenRouter', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(completion('{"ok":true}'));

    await createClient(undefined).generatePrompt(openRouterConnection, structuredRequest);

    const { url, headers, body } = readRequest(fetchMock);

    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(headers.get('x-title')).toBe('AI Template Admin');
    expect(body.provider).toEqual({
      require_parameters: true,
      order: ['cloudflare', 'baidu'],
      allow_fallbacks: true,
    });
    expect(body.plugins).toEqual([{ id: 'response-healing' }]);
  });

  it('sends session_id and throughput routing only to OpenRouter and returns provider and usage', async () => {
    const withRouting = {
      ...structuredRequest,
      sessionId: 'prof-orientation-1-try-1',
      provider: { preferred_min_throughput: { p50: 50 }, ignore: ['cloudflare'] },
    };
    const fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(
        jsonResponse({
          id: 'x',
          object: 'chat.completion',
          created: 0,
          model: 'm',
          provider: 'Alibaba',
          usage: { prompt_tokens: 10, completion_tokens: 5, cost: 0.001 },
          choices: [
            {
              index: 0,
              finish_reason: 'stop',
              message: { role: 'assistant', content: '{"ok":true}' },
            },
          ],
        }),
      ),
    );

    const result = await createClient(undefined).generatePrompt(openRouterConnection, withRouting);
    await createClient(undefined).generatePrompt(polzaConnection, withRouting);

    const openRouterBody = readRequest(fetchMock, 0).body;
    const polzaBody = readRequest(fetchMock, 1).body;

    expect(openRouterBody.session_id).toBe('prof-orientation-1-try-1');
    expect(openRouterBody.provider).toEqual({
      require_parameters: true,
      preferred_min_throughput: { p50: 50 },
      ignore: ['cloudflare'],
    });
    expect(polzaBody.session_id).toBeUndefined();
    expect(polzaBody.provider).toBeUndefined();
    expect(result.provider).toBe('Alibaba');
    expect(result.usage).toMatchObject({ prompt_tokens: 10, completion_tokens: 5, cost: 0.001 });
  });

  it('surfaces the provider error message without the status prefix', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(jsonResponse({ error: { message: 'User not found.' } }, 401));

    await expect(
      createClient(undefined).generatePrompt(polzaConnection, structuredRequest),
    ).rejects.toThrow(/^User not found\.$/);
  });

  it('maps an SDK timeout to the timeout message analysis retries on', async () => {
    jest.spyOn(global, 'fetch').mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(Object.assign(new Error('aborted'), { name: 'AbortError' })),
          );
        }),
    );

    await expect(
      createClient(undefined).generatePrompt(polzaConnection, structuredRequest, { timeoutMs: 20 }),
    ).rejects.toThrow(AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE);
  });

  it('loads the chat model catalog with the provider query and the configured default model', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      jsonResponse({
        object: 'list',
        data: [
          {
            id: 'openai/gpt-4o',
            name: 'GPT-4o',
            type: 'chat',
            top_provider: { supported_parameters: ['response_format'], pricing: {} },
          },
          {
            id: 'openai/gpt-4o-mini',
            name: 'GPT-4o mini',
            type: 'chat',
            top_provider: { supported_parameters: ['response_format'], pricing: {} },
          },
        ],
      }),
    );

    const catalog = await createClient(undefined).fetchModels({
      ...polzaConnection,
      defaultModel: 'openai/gpt-4o-mini',
    });

    expect(readRequest(fetchMock).url).toBe('https://polza.ai/api/v1/models?type=chat');
    expect(catalog.defaultModel).toBe('openai/gpt-4o-mini');
    expect(catalog.models.map((model) => model.id)).toEqual([
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
    ]);
  });
});
