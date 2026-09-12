import { ConfigService } from '@nestjs/config';

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

    expect(fetchModelsSpy).toHaveBeenCalledWith('test-key');
    expect(health.status).toBe('ok');
    expect(health.errorMessage).toBeUndefined();
    expect(Number.isNaN(Date.parse(health.checkedAt))).toBe(false);
  });

  it('reports a failed connection with the reason instead of throwing', async () => {
    const client = createClient(undefined);
    jest.spyOn(client, 'fetchModels').mockRejectedValue(new Error('User not found.'));

    await expect(client.checkHealth('bad-key')).resolves.toMatchObject({
      status: 'failed',
      errorMessage: 'User not found.',
    });
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
});
