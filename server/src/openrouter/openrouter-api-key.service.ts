import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';

type OpenRouterApiKeySource = 'ENV' | 'NONE';

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

  getOpenRouterApiKey() {
    const envApiKey = this.getEnvApiKey();

    if (envApiKey) {
      return Promise.resolve(envApiKey);
    }

    return Promise.reject(
      new ServiceUnavailableException('OPENROUTER_API_KEY is not configured on server'),
    );
  }

  async getOpenRouterSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const envApiKey = this.getEnvApiKey();

    return this.toSettingsResponse({
      apiKey: envApiKey,
      source: envApiKey ? 'ENV' : 'NONE',
      updatedAt: null,
    });
  }
}
