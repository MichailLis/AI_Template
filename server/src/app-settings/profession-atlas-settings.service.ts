import { BadRequestException, Injectable } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';

const PROFESSION_ATLAS_URL_SETTING_KEY = 'professionAtlas.url';
const PROFESSION_ATLAS_PUBLIC_URL_SETTING_KEY = 'professionAtlas.publicUrl';
const PROFESSION_ATLAS_API_URL_SETTING_KEY = 'professionAtlas.apiUrl';

type StoredProfessionAtlasUrl = {
  publicUrl: string | null;
  apiUrl: string | null;
  updatedAt: Date | null;
};

@Injectable()
export class ProfessionAtlasSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getSetting(key: string) {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        key,
      },
    });

    return setting && setting.value.trim() ? setting : null;
  }

  private async getStoredProfessionAtlasUrl(): Promise<StoredProfessionAtlasUrl> {
    const [publicUrlSetting, apiUrlSetting, legacyUrlSetting] = await Promise.all([
      this.getSetting(PROFESSION_ATLAS_PUBLIC_URL_SETTING_KEY),
      this.getSetting(PROFESSION_ATLAS_API_URL_SETTING_KEY),
      this.getSetting(PROFESSION_ATLAS_URL_SETTING_KEY),
    ]);
    const publicUrl = publicUrlSetting?.value.trim() ?? legacyUrlSetting?.value.trim() ?? null;
    const apiUrl = apiUrlSetting?.value.trim() ?? null;
    const updatedAt =
      [publicUrlSetting?.updatedAt, apiUrlSetting?.updatedAt, legacyUrlSetting?.updatedAt]
        .filter((value): value is Date => value instanceof Date)
        .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

    return {
      publicUrl,
      apiUrl,
      updatedAt,
    };
  }

  private toSettingsResponse(setting: StoredProfessionAtlasUrl) {
    return {
      professionAtlas: {
        url: setting.publicUrl,
        publicUrl: setting.publicUrl,
        apiUrl: setting.apiUrl,
        updatedAt: setting.updatedAt ? setting.updatedAt.toISOString() : null,
      },
    };
  }

  async getProfessionAtlasUrl() {
    const setting = await this.getStoredProfessionAtlasUrl();

    return setting.publicUrl;
  }

  async getProfessionAtlasConnection() {
    const setting = await this.getStoredProfessionAtlasUrl();

    return {
      publicUrl: setting.publicUrl,
      apiUrl: setting.apiUrl,
    };
  }

  async getProfessionAtlasSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    return this.toSettingsResponse(await this.getStoredProfessionAtlasUrl());
  }

  async updateProfessionAtlasUrl(
    userId: number,
    input:
      | string
      | {
          publicUrl: string;
          apiUrl: string;
        },
  ) {
    await ensureAdminAccess(this.prisma, userId);

    const normalizedPublicUrl = typeof input === 'string' ? input.trim() : input.publicUrl.trim();
    const normalizedApiUrl = typeof input === 'string' ? '' : input.apiUrl.trim();

    if (!normalizedPublicUrl || !normalizedApiUrl) {
      throw new BadRequestException('Profession atlas URLs must not be empty');
    }

    const [publicUrlSetting, apiUrlSetting] = await Promise.all([
      this.prisma.appSetting.upsert({
        where: {
          key: PROFESSION_ATLAS_PUBLIC_URL_SETTING_KEY,
        },
        create: {
          key: PROFESSION_ATLAS_PUBLIC_URL_SETTING_KEY,
          value: normalizedPublicUrl,
        },
        update: {
          value: normalizedPublicUrl,
        },
      }),
      this.prisma.appSetting.upsert({
        where: {
          key: PROFESSION_ATLAS_API_URL_SETTING_KEY,
        },
        create: {
          key: PROFESSION_ATLAS_API_URL_SETTING_KEY,
          value: normalizedApiUrl,
        },
        update: {
          value: normalizedApiUrl,
        },
      }),
    ]);

    return this.toSettingsResponse({
      publicUrl: publicUrlSetting.value.trim(),
      apiUrl: apiUrlSetting.value.trim(),
      updatedAt:
        publicUrlSetting.updatedAt > apiUrlSetting.updatedAt
          ? publicUrlSetting.updatedAt
          : apiUrlSetting.updatedAt,
    });
  }
}
