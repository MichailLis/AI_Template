import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import type { AuditService } from '../audit/audit.service';
import type { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { AiProviderConfigService } from './ai-provider-config.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

type AuditEvent = {
  entityType: string;
  changes: Array<{ field: string; before: string | null; after: string | null }>;
};
type Row = { key: string; value: string; updatedAt: Date };

describe('AiProviderConfigService', () => {
  let rows: Map<string, Row>;
  let auditMock: { record: jest.Mock<Promise<void>, [AuditEvent]> };

  const createService = (env: Record<string, string | undefined>) => {
    const appSetting = {
      findMany: jest.fn(({ where }: { where: { key: { in: string[] } } }) =>
        Promise.resolve([...rows.values()].filter((row) => where.key.in.includes(row.key))),
      ),
      upsert: jest.fn(
        ({ where, create }: { where: { key: string }; create: { value: string } }) => {
          rows.set(where.key, { key: where.key, value: create.value, updatedAt: new Date() });
          return Promise.resolve();
        },
      ),
      deleteMany: jest.fn(({ where }: { where: { key: string } }) => {
        rows.delete(where.key);
        return Promise.resolve();
      }),
    };
    const prisma = {
      appSetting,
      $transaction: (callback: (tx: unknown) => unknown) => callback({ appSetting }),
    };

    return new AiProviderConfigService(
      prisma as unknown as PrismaService,
      { get: jest.fn((name: string) => env[name]) } as unknown as ConfigService,
      auditMock as unknown as AuditService,
    );
  };

  const secret = { JWT_REFRESH_SECRET: 'refresh-secret-for-tests' };

  beforeEach(() => {
    rows = new Map();
    auditMock = { record: jest.fn<Promise<void>, [AuditEvent]>().mockResolvedValue(undefined) };
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('defaults to Polza.ai when only AI_API_KEY is set', async () => {
    await expect(createService({ AI_API_KEY: ' pza-key ' }).getConnection()).resolves.toMatchObject(
      {
        provider: 'polza',
        baseUrl: 'https://polza.ai/api/v1',
        apiKey: 'pza-key',
        supportsOpenRouterExtensions: false,
        modelsQuery: { type: 'chat' },
      },
    );
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
    });
  });

  it('requires a base URL for a generic OpenAI-compatible provider', async () => {
    await expect(
      createService({ AI_PROVIDER: 'openai-compatible', AI_API_KEY: 'key' }).getConnection(),
    ).rejects.toThrow(ServiceUnavailableException);
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

  it('throws when no AI provider key is configured', async () => {
    await expect(createService({}).getConnection()).rejects.toThrow(ServiceUnavailableException);
  });

  it('reports masked settings from env', async () => {
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
    expect(ensureAdminAccess).toHaveBeenCalledWith(expect.anything(), 3);
  });

  describe('settings saved in the admin panel', () => {
    it('stores the key encrypted and uses it for requests', async () => {
      const service = createService(secret);

      await service.updateAiProviderSettings(3, {
        provider: 'polza',
        baseUrl: null,
        apiKey: 'pza-super-secret-key',
        defaultModel: 'openai/gpt-4o-mini',
      });

      const stored = rows.get('ai.apiKey')?.value ?? '';
      expect(stored.startsWith('enc:v1:')).toBe(true);
      expect(stored).not.toContain('pza-super-secret-key');
      await expect(service.getConnection()).resolves.toMatchObject({
        provider: 'polza',
        baseUrl: 'https://polza.ai/api/v1',
        apiKey: 'pza-super-secret-key',
        defaultModel: 'openai/gpt-4o-mini',
      });
      await expect(service.getAiProviderSettings(3)).resolves.toMatchObject({
        aiProvider: { source: 'DB', maskedValue: 'pza-supe...-key' },
      });
    });

    it('lets the saved provider and base URL override env, keeping the env key as fallback', async () => {
      const service = createService({
        ...secret,
        AI_PROVIDER: 'openrouter',
        AI_BASE_URL: 'https://old.example.com/v1',
        AI_API_KEY: 'env-key',
      });

      await service.updateAiProviderSettings(3, {
        provider: 'openai-compatible',
        baseUrl: 'https://llm.example.com/v1',
        defaultModel: null,
      });

      await expect(service.getConnection()).resolves.toMatchObject({
        provider: 'openai-compatible',
        baseUrl: 'https://llm.example.com/v1',
        apiKey: 'env-key',
        supportsOpenRouterExtensions: false,
      });
    });

    it('keeps the saved key when none is sent and drops it on clearApiKey', async () => {
      const service = createService({ ...secret, AI_API_KEY: 'env-key' });
      const base = { provider: 'polza' as const, baseUrl: null, defaultModel: null };

      await service.updateAiProviderSettings(3, { ...base, apiKey: 'db-key-123456' });
      await service.updateAiProviderSettings(3, base);
      await expect(service.getConnection()).resolves.toMatchObject({ apiKey: 'db-key-123456' });

      await service.updateAiProviderSettings(3, { ...base, clearApiKey: true });
      await expect(service.getConnection()).resolves.toMatchObject({ apiKey: 'env-key' });
    });

    it('treats a key that cannot be decrypted as not set', async () => {
      await createService(secret).updateAiProviderSettings(3, {
        provider: 'polza',
        baseUrl: null,
        apiKey: 'db-key-123456',
        defaultModel: null,
      });

      await expect(
        createService({ JWT_REFRESH_SECRET: 'rotated-secret' }).getConnection(),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('requires a base URL for a generic provider', async () => {
      await expect(
        createService(secret).updateAiProviderSettings(3, {
          provider: 'openai-compatible',
          baseUrl: null,
          apiKey: 'key',
          defaultModel: null,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('audits the change without writing the key into the journal', async () => {
      await createService(secret).updateAiProviderSettings(3, {
        provider: 'polza',
        baseUrl: null,
        apiKey: 'db-key-123456',
        defaultModel: 'openai/gpt-4o-mini',
      });

      expect(auditMock.record).toHaveBeenCalledTimes(1);
      const event = auditMock.record.mock.calls[0]?.[0];

      expect(event?.entityType).toBe('APP_SETTING');
      expect(event?.changes).toContainEqual({
        field: 'defaultModel',
        before: null,
        after: 'openai/gpt-4o-mini',
      });
      expect(event?.changes).toContainEqual({ field: 'apiKey', before: null, after: null });
      expect(JSON.stringify(event)).not.toContain('db-key-123456');
    });
  });
});
