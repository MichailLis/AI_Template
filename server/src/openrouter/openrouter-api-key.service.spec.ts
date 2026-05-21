import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
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
      upsert: jest.Mock;
    };
  };
  let configMock: {
    get: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      appSetting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
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

  it('uses the saved database key before the env fallback', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'openrouter.apiKey',
      value: ' db-key ',
      updatedAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    configMock.get.mockReturnValue('env-key');

    await expect(service.getOpenRouterApiKey()).resolves.toBe('db-key');
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
  });

  it('throws when no OpenRouter key is configured', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);
    configMock.get.mockReturnValue(undefined);

    await expect(service.getOpenRouterApiKey()).rejects.toThrow(ServiceUnavailableException);
  });

  it('saves a trimmed api key and returns only a masked value', async () => {
    prismaMock.appSetting.upsert.mockResolvedValue({
      key: 'openrouter.apiKey',
      value: 'sk-or-v1-new-secret',
      updatedAt: new Date('2026-05-01T11:00:00.000Z'),
    });

    await expect(service.updateOpenRouterApiKey(3, ' sk-or-v1-new-secret ')).resolves.toEqual({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'DATABASE',
        updatedAt: '2026-05-01T11:00:00.000Z',
      },
    });

    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      create: {
        key: 'openrouter.apiKey',
        value: 'sk-or-v1-new-secret',
      },
      update: {
        value: 'sk-or-v1-new-secret',
      },
      where: {
        key: 'openrouter.apiKey',
      },
    });
  });

  it('rejects an empty api key before saving', async () => {
    await expect(service.updateOpenRouterApiKey(3, '   ')).rejects.toThrow(BadRequestException);
    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled();
  });
});
