import { ConfigService } from '@nestjs/config';

import { OpenRouterClientService } from './openrouter.client';

describe('openrouter client', () => {
  const createClient = (value: string | number | undefined) =>
    new OpenRouterClientService({
      get: jest.fn().mockReturnValue(value),
    } as unknown as ConfigService);

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
});
