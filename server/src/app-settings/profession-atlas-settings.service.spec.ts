import { BadRequestException } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { ProfessionAtlasSettingsService } from './profession-atlas-settings.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('ProfessionAtlasSettingsService', () => {
  let service: ProfessionAtlasSettingsService;
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
    service = new ProfessionAtlasSettingsService(prismaMock as unknown as PrismaService);
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns the trimmed URL from app settings for public result pages', async () => {
    prismaMock.appSetting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === 'professionAtlas.url') {
        return Promise.resolve({
          key: 'professionAtlas.url',
          value: ' https://atlas.example/professions ',
          updatedAt: new Date('2026-05-12T10:00:00.000Z'),
        });
      }

      return Promise.resolve(null);
    });

    await expect(service.getProfessionAtlasUrl()).resolves.toBe(
      'https://atlas.example/professions',
    );
  });

  it('returns admin settings with access check and updated timestamp', async () => {
    prismaMock.appSetting.findUnique.mockImplementation(({ where }: { where: { key: string } }) => {
      if (where.key === 'professionAtlas.publicUrl') {
        return Promise.resolve({
          key: 'professionAtlas.publicUrl',
          value: 'https://atlas.example',
          updatedAt: new Date('2026-05-12T10:00:00.000Z'),
        });
      }

      if (where.key === 'professionAtlas.apiUrl') {
        return Promise.resolve({
          key: 'professionAtlas.apiUrl',
          value: 'https://atlas.example/api-backend',
          updatedAt: new Date('2026-05-12T11:00:00.000Z'),
        });
      }

      return Promise.resolve(null);
    });

    await expect(service.getProfessionAtlasSettings(3)).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        updatedAt: '2026-05-12T11:00:00.000Z',
      },
    });
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
  });

  it('saves trimmed profession atlas public and API URLs', async () => {
    prismaMock.appSetting.upsert
      .mockResolvedValueOnce({
        key: 'professionAtlas.publicUrl',
        value: 'https://atlas.example',
        updatedAt: new Date('2026-05-12T10:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        key: 'professionAtlas.apiUrl',
        value: 'https://atlas.example/api-backend',
        updatedAt: new Date('2026-05-12T11:00:00.000Z'),
      });

    await expect(
      service.updateProfessionAtlasUrl(3, {
        publicUrl: ' https://atlas.example ',
        apiUrl: ' https://atlas.example/api-backend ',
      }),
    ).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        updatedAt: '2026-05-12T11:00:00.000Z',
      },
    });

    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      create: {
        key: 'professionAtlas.publicUrl',
        value: 'https://atlas.example',
      },
      update: {
        value: 'https://atlas.example',
      },
      where: {
        key: 'professionAtlas.publicUrl',
      },
    });
    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      create: {
        key: 'professionAtlas.apiUrl',
        value: 'https://atlas.example/api-backend',
      },
      update: {
        value: 'https://atlas.example/api-backend',
      },
      where: {
        key: 'professionAtlas.apiUrl',
      },
    });
  });

  it('rejects an empty profession atlas URL before saving', async () => {
    await expect(
      service.updateProfessionAtlasUrl(3, {
        publicUrl: '   ',
        apiUrl: 'https://atlas.example/api-backend',
      }),
    ).rejects.toThrow(BadRequestException);
    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled();
  });
});
