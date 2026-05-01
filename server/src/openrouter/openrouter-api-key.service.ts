import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ensureAdminAccess } from '../admin/admin-access.utils';
import { PrismaService } from '../prisma.service';

const OPENROUTER_API_KEY_SETTING_KEY = 'openrouter.apiKey';

type OpenRouterApiKeySource = 'DATABASE' | 'ENV' | 'NONE';

interface StoredApiKey {
  value: string;
  updatedAt: Date;
}

@Injectable()
export class OpenRouterApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private maskApiKey(apiKey: string) {
    if (apiKey.length <= 12) {
      return `****${apiKey.slice(-4)}`;
    }

    return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
  }

  private async getStoredApiKey(): Promise<StoredApiKey | null> {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        key: OPENROUTER_API_KEY_SETTING_KEY,
      },
    });
    const value = setting?.value.trim();

    if (!setting || !value) {
      return null;
    }

    return {
      value,
      updatedAt: setting.updatedAt,
    };
  }

  private getEnvApiKey() {
    return this.config.get<string>('OPENROUTER_API_KEY')?.trim() || null;
  }

  private toSettingsResponse(input: {
    apiKey: string | null;
    source: OpenRouterApiKeySource;
    updatedAt: Date | null;
  }) {
    return {
      openRouter: {
        isConfigured: Boolean(input.apiKey),
        maskedValue: input.apiKey ? this.maskApiKey(input.apiKey) : null,
        source: input.source,
        updatedAt: input.updatedAt ? input.updatedAt.toISOString() : null,
      },
    };
  }

  async getOpenRouterApiKey() {
    const storedApiKey = await this.getStoredApiKey();

    if (storedApiKey) {
      return storedApiKey.value;
    }

    const envApiKey = this.getEnvApiKey();

    if (envApiKey) {
      return envApiKey;
    }

    throw new ServiceUnavailableException('OPENROUTER_API_KEY is not configured on server');
  }

  async getOpenRouterSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const storedApiKey = await this.getStoredApiKey();

    if (storedApiKey) {
      return this.toSettingsResponse({
        apiKey: storedApiKey.value,
        source: 'DATABASE',
        updatedAt: storedApiKey.updatedAt,
      });
    }

    const envApiKey = this.getEnvApiKey();

    return this.toSettingsResponse({
      apiKey: envApiKey,
      source: envApiKey ? 'ENV' : 'NONE',
      updatedAt: null,
    });
  }

  async updateOpenRouterApiKey(userId: number, apiKey: string) {
    await ensureAdminAccess(this.prisma, userId);

    const normalizedApiKey = apiKey.trim();

    if (!normalizedApiKey) {
      throw new BadRequestException('OpenRouter API key must not be empty');
    }

    const setting = await this.prisma.appSetting.upsert({
      where: {
        key: OPENROUTER_API_KEY_SETTING_KEY,
      },
      create: {
        key: OPENROUTER_API_KEY_SETTING_KEY,
        value: normalizedApiKey,
      },
      update: {
        value: normalizedApiKey,
      },
    });

    return this.toSettingsResponse({
      apiKey: setting.value.trim(),
      source: 'DATABASE',
      updatedAt: setting.updatedAt,
    });
  }
}
