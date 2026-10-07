import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { AiProviderConfigService } from './ai-provider-config.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('AiProviderConfigService', () => {
  let prismaMock: {
    appSetting: {
      findUnique: jest.Mock;
    };
  };

  const createService = (env: Record<string, string | undefined>) =>
    new AiProviderConfigService(
      prismaMock as unknown as PrismaService,
      { get: jest.fn((name: string) => env[name]) } as unknown as ConfigService,
    );

  beforeEach(() => {
    prismaMock = {
      appSetting: {
        findUnique: jest.fn(),
      },
    };
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to Polza.ai when only AI_API_KEY is set', async () => {
    await expect(createService({ AI_API_KEY: ' pza-key ' }).getConnection()).resolves.toEqual({
      provider: 'polza',
      label: 'Polza.ai',
      baseUrl: 'https://polza.ai/api/v1',
      apiKey: 'pza-key',
      defaultModel: null,
      supportsOpenRouterExtensions: false,
      modelsQuery: { type: 'chat' },
    });
  });

  it('connects any OpenAI-compatible service through AI_BASE_URL', async () => {
    await expect(
      createService({
        AI_PROVIDER: 'openai-compatible',
        AI_BASE_URL: 'https://llm.example.com/v1/',
        AI_API_KEY: 'key',
        AI_DEFAULT_MODEL: 'gpt-4o-mini',
      }).getConnection(),
    ).resolves.toMatchObject({
      provider: 'openai-compatible',
      baseUrl: 'https://llm.example.com/v1',
      defaultModel: 'gpt-4o-mini',
      supportsOpenRouterExtensions: false,
    });
  });

  it('requires AI_BASE_URL for a generic OpenAI-compatible provider', async () => {
    await expect(
      createService({ AI_PROVIDER: 'openai-compatible', AI_API_KEY: 'key' }).getConnection(),
    ).rejects.toThrow('AI_BASE_URL is required for AI_PROVIDER=openai-compatible');
  });

  it('rejects an unknown AI_PROVIDER instead of guessing', async () => {
    await expect(
      createService({ AI_PROVIDER: 'nope', AI_API_KEY: 'key' }).getConnection(),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('keeps an environment that only has OPENROUTER_API_KEY on OpenRouter', async () => {
    await expect(
      createService({
        OPENROUTER_API_KEY: 'sk-or-v1-legacy',
        OPENROUTER_DEFAULT_MODEL: 'openai/gpt-4o-mini',
      }).getConnection(),
    ).resolves.toMatchObject({
      provider: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: 'sk-or-v1-legacy',
      defaultModel: 'openai/gpt-4o-mini',
      supportsOpenRouterExtensions: true,
    });
  });

  it('prefers AI_API_KEY over the legacy OpenRouter key once it is set', async () => {
    await expect(
      createService({
        AI_API_KEY: 'pza-key',
        OPENROUTER_API_KEY: 'sk-or-v1-legacy',
      }).getConnection(),
    ).resolves.toMatchObject({ provider: 'polza', apiKey: 'pza-key' });
  });

  it('reports masked settings from env without reading the database', async () => {
    await expect(
      createService({ AI_API_KEY: 'pza-v1-env-secret' }).getAiProviderSettings(3),
    ).resolves.toEqual({
      aiProvider: {
        provider: 'polza',
        label: 'Polza.ai',
        baseUrl: 'https://polza.ai/api/v1',
        defaultModel: null,
        isConfigured: true,
        maskedValue: 'pza-v1-e...cret',
        source: 'ENV',
        updatedAt: null,
      },
    });
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
    expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
  });

  it('throws when no AI provider key is configured', async () => {
    await expect(createService({}).getConnection()).rejects.toThrow(ServiceUnavailableException);
    expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
  });

  it('does not expose a database write path for provider secrets', () => {
    const service = createService({});

    expect('updateAiProviderApiKey' in service).toBe(false);
    expect('updateOpenRouterApiKey' in service).toBe(false);
  });
});
