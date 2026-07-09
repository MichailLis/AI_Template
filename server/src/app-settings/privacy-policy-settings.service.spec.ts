import { BadRequestException } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { PrivacyPolicySettingsService } from './privacy-policy-settings.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('PrivacyPolicySettingsService', () => {
  let service: PrivacyPolicySettingsService;
  let prismaMock: {
    appSetting: {
      findUnique: jest.Mock;
      upsert: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      appSetting: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
    };
    service = new PrivacyPolicySettingsService(prismaMock as unknown as PrismaService);
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns bundled public policy when database setting is missing', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    const response = await service.getPublicPrivacyPolicy();

    expect(response).toMatchObject({
      privacyPolicy: {
        version: '2026-07-09',
        publishedAt: '2026-07-09T00:00:00.000Z',
        updatedAt: null,
      },
    });
    expect(response.privacyPolicy.content).toContain('ПОЛИТИКА');
  });

  it('returns stored policy payload when it is valid', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(service.getPublicPrivacyPolicy()).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    });
  });

  it('falls back to bundled policy when stored JSON is invalid', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: '{"version":""}',
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    const response = await service.getPublicPrivacyPolicy();

    expect(response).toMatchObject({
      privacyPolicy: {
        version: '2026-07-09',
        updatedAt: null,
      },
    });
    expect(response.privacyPolicy.content).toContain('ПОЛИТИКА');
  });

  it('checks admin access before returning admin policy settings', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue(null);

    await service.getAdminPrivacyPolicy(3);

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
  });

  it('saves trimmed policy settings as JSON', async () => {
    prismaMock.appSetting.upsert.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Новая политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(
      service.updatePrivacyPolicy(3, {
        version: ' 2026-07-10 ',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: ' Новая политика ',
      }),
    ).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Новая политика',
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    });

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      where: {
        key: 'privacy.policy',
      },
      create: {
        key: 'privacy.policy',
        value: JSON.stringify({
          version: '2026-07-10',
          publishedAt: '2026-07-10T00:00:00.000Z',
          content: 'Новая политика',
        }),
      },
      update: {
        value: JSON.stringify({
          version: '2026-07-10',
          publishedAt: '2026-07-10T00:00:00.000Z',
          content: 'Новая политика',
        }),
      },
    });
  });

  it('rejects empty policy content before saving', async () => {
    await expect(
      service.updatePrivacyPolicy(3, {
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: '   ',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled();
  });

  it('returns active policy snapshot for new attempts', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'privacy.policy',
      value: JSON.stringify({
        version: '2026-07-10',
        publishedAt: '2026-07-10T00:00:00.000Z',
        content: 'Опубликованная политика',
      }),
      updatedAt: new Date('2026-07-10T12:00:00.000Z'),
    });

    await expect(service.getActivePolicySnapshot()).resolves.toEqual({
      version: '2026-07-10',
      publishedAt: new Date('2026-07-10T00:00:00.000Z'),
      content: 'Опубликованная политика',
    });
  });
});
