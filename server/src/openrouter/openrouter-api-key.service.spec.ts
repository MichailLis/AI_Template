import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { OpenRouterApiKeyService } from './openrouter-api-key.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('OpenRouterApiKeyService', () => {
  let service: OpenRouterApiKeyService;
  let prismaMock: {
    appSetting: {
      findUnique: jest.Mock;
    };
  };
  let configMock: {
    get: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      appSetting: {
        findUnique: jest.fn(),
      },
    };
    configMock = {
      get: jest.fn(),
    };

    service = new OpenRouterApiKeyService(
      prismaMock as unknown as PrismaService,
      configMock as unknown as ConfigService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('uses only the env key and ignores any legacy saved database key', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'openrouter.apiKey',
      value: ' db-key ',
      updatedAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    configMock.get.mockReturnValue('env-key');

    await expect(service.getOpenRouterApiKey()).resolves.toBe('env-key');
    expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
  });

  it('reports masked settings from env when database key is missing', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);
    configMock.get.mockReturnValue('sk-or-v1-env-secret');

    await expect(service.getOpenRouterSettings(3)).resolves.toEqual({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'ENV',
        updatedAt: null,
      },
    });
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
    expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
  });

  it('throws when no OpenRouter key is configured', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);
    configMock.get.mockReturnValue(undefined);

    await expect(service.getOpenRouterApiKey()).rejects.toThrow(ServiceUnavailableException);
    expect(prismaMock.appSetting.findUnique).not.toHaveBeenCalled();
  });

  it('does not expose a database write path for OpenRouter secrets', () => {
    expect('updateOpenRouterApiKey' in service).toBe(false);
  });
});
