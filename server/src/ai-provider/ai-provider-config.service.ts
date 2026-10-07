import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import {
  type AiProviderConnection,
  type AiProviderSettings,
  resolveAiProviderSettings,
} from './ai-provider.config';

type AiProviderApiKeySource = 'ENV' | 'NONE';

@Injectable()
export class AiProviderConfigService {
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

  private resolveSettings(): AiProviderSettings {
    try {
      return resolveAiProviderSettings(this.config);
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'AI provider is misconfigured',
      );
    }
  }

  /** Адрес и ключ провайдера для запроса. Без них запрос не уходит: 503 вместо обращения в сеть. */
  getConnection(): Promise<AiProviderConnection> {
    try {
      const settings = this.resolveSettings();

      if (!settings.baseUrl) {
        throw new ServiceUnavailableException(
          `AI_BASE_URL is required for AI_PROVIDER=${settings.provider}`,
        );
      }

      if (!settings.apiKey) {
        throw new ServiceUnavailableException('AI_API_KEY is not configured on server');
      }

      return Promise.resolve({ ...settings, baseUrl: settings.baseUrl, apiKey: settings.apiKey });
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
  }

  async getAiProviderSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const settings = this.resolveSettings();
    const source: AiProviderApiKeySource = settings.apiKey ? 'ENV' : 'NONE';

    return {
      aiProvider: {
        provider: settings.provider,
        label: settings.label,
        baseUrl: settings.baseUrl,
        defaultModel: settings.defaultModel,
        isConfigured: Boolean(settings.apiKey && settings.baseUrl),
        maskedValue: settings.apiKey ? this.maskApiKey(settings.apiKey) : null,
        source,
        updatedAt: null,
      },
    };
  }
}
