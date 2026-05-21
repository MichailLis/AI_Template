import { BadRequestException, Injectable } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';

const PROFESSION_ATLAS_URL_SETTING_KEY = 'professionAtlas.url';

type StoredProfessionAtlasUrl = {
  url: string;
  updatedAt: Date;
};

@Injectable()
export class ProfessionAtlasSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getStoredProfessionAtlasUrl(): Promise<StoredProfessionAtlasUrl | null> {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        key: PROFESSION_ATLAS_URL_SETTING_KEY,
      },
    });
    const url = setting?.value.trim();

    if (!setting || !url) {
      return null;
    }

    return {
      url,
      updatedAt: setting.updatedAt,
    };
  }

  private toSettingsResponse(setting: StoredProfessionAtlasUrl | null) {
    return {
      professionAtlas: {
        url: setting?.url ?? null,
        updatedAt: setting ? setting.updatedAt.toISOString() : null,
      },
    };
  }

  async getProfessionAtlasUrl() {
    const setting = await this.getStoredProfessionAtlasUrl();

    return setting?.url ?? null;
  }

  async getProfessionAtlasSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    return this.toSettingsResponse(await this.getStoredProfessionAtlasUrl());
  }

  async updateProfessionAtlasUrl(userId: number, url: string) {
    await ensureAdminAccess(this.prisma, userId);

    const normalizedUrl = url.trim();

    if (!normalizedUrl) {
      throw new BadRequestException('Profession atlas URL must not be empty');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: {
        key: PROFESSION_ATLAS_URL_SETTING_KEY,
      },
      create: {
        key: PROFESSION_ATLAS_URL_SETTING_KEY,
        value: normalizedUrl,
      },
      update: {
        value: normalizedUrl,
      },
    });

    return this.toSettingsResponse({
      url: setting.value.trim(),
      updatedAt: setting.updatedAt,
    });
  }
}
