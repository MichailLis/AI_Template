import { BadRequestException } from '@nestjs/common';

import { ensureAdminAccess } from '../admin/admin-access.utils';
import { PrismaService } from '../prisma.service';
import { ProfessionAtlasSettingsService } from './profession-atlas-settings.service';

jest.mock('../admin/admin-access.utils', () => ({
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
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'professionAtlas.url',
      value: ' https://atlas.example/professions ',
      updatedAt: new Date('2026-05-12T10:00:00.000Z'),
    });

    await expect(service.getProfessionAtlasUrl()).resolves.toBe(
      'https://atlas.example/professions',
    );
  });

  it('returns admin settings with access check and updated timestamp', async () => {
    prismaMock.appSetting.findUnique.mockResolvedValue({
      key: 'professionAtlas.url',
      value: 'https://atlas.example/professions',
      updatedAt: new Date('2026-05-12T10:00:00.000Z'),
    });

    await expect(service.getProfessionAtlasSettings(3)).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example/professions',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
  });

  it('saves a trimmed profession atlas URL', async () => {
    prismaMock.appSetting.upsert.mockResolvedValue({
      key: 'professionAtlas.url',
      value: 'https://atlas.example/professions',
      updatedAt: new Date('2026-05-12T10:00:00.000Z'),
    });

    await expect(
      service.updateProfessionAtlasUrl(3, ' https://atlas.example/professions '),
    ).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example/professions',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });

    expect(prismaMock.appSetting.upsert).toHaveBeenCalledWith({
      create: {
        key: 'professionAtlas.url',
        value: 'https://atlas.example/professions',
      },
      update: {
        value: 'https://atlas.example/professions',
      },
      where: {
        key: 'professionAtlas.url',
      },
    });
  });

  it('rejects an empty profession atlas URL before saving', async () => {
    await expect(service.updateProfessionAtlasUrl(3, '   ')).rejects.toThrow(BadRequestException);
    expect(prismaMock.appSetting.upsert).not.toHaveBeenCalled();
  });
});
