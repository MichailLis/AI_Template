import { ConfigService } from '@nestjs/config';

import { resolveOpenRouterTimeoutMs } from './openrouter.client';

describe('openrouter client', () => {
  const createConfig = (value: string | number | undefined) =>
    ({
      get: jest.fn().mockReturnValue(value),
    }) as unknown as ConfigService;

  it('uses configured OpenRouter timeout when it is a positive number', () => {
    expect(resolveOpenRouterTimeoutMs(createConfig('180000'))).toBe(180_000);
    expect(resolveOpenRouterTimeoutMs(createConfig(90_000))).toBe(90_000);
  });

  it('uses request timeout override before global OpenRouter timeout', () => {
    expect(resolveOpenRouterTimeoutMs(createConfig('120000'), 180_000)).toBe(180_000);
  });

  it('falls back to a longer default timeout for structured analysis requests', () => {
    expect(resolveOpenRouterTimeoutMs(createConfig(undefined))).toBe(120_000);
    expect(resolveOpenRouterTimeoutMs(createConfig('not-a-number'))).toBe(120_000);
    expect(resolveOpenRouterTimeoutMs(createConfig('-1'))).toBe(120_000);
  });
});
