import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { collectAuditChanges } from '../audit/audit-changes';
import { AuditService } from '../audit/audit.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import {
  AI_PROVIDER_PRESETS,
  type AiProviderConnection,
  type AiProviderId,
  type AiProviderSettings,
  isAiProviderId,
  resolveAiProviderSettings,
  type StoredAiProviderSettings,
} from './ai-provider.config';
import { decryptSecret, encryptSecret } from './ai-provider.secret';

/** Идентификатор настройки в журнале изменений. */
const AI_PROVIDER_AUDIT_ENTITY_ID = 'ai-provider';
const KEYS = {
  provider: 'ai.provider',
  baseUrl: 'ai.baseUrl',
  apiKey: 'ai.apiKey',
  defaultModel: 'ai.defaultModel',
} as const;

export interface UpdateAiProviderInput {
  provider: AiProviderId;
  /** Пусто — адрес по умолчанию для выбранного провайдера. */
  baseUrl: string | null;
  /** Не передан — сохранённый ключ остаётся как есть. */
  apiKey?: string;
  /** Удалить сохранённый ключ из БД (останется ключ из env, если он задан). */
  clearApiKey?: boolean;
  defaultModel: string | null;
}

@Injectable()
export class AiProviderConfigService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  private maskApiKey(apiKey: string) {
    if (apiKey.length <= 12) {
      return `****${apiKey.slice(-4)}`;
    }

    return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
  }

  private getEncryptionSecret() {
    const secret = this.config.get<string>('JWT_REFRESH_SECRET')?.trim();

    if (!secret) {
      throw new ServiceUnavailableException(
        'JWT_REFRESH_SECRET is required to store the AI provider key',
      );
    }

    return secret;
  }

  private async loadStored(): Promise<{
    stored: StoredAiProviderSettings;
    updatedAt: Date | null;
  }> {
    const rows = await this.prisma.appSetting.findMany({
      where: { key: { in: Object.values(KEYS) } },
    });
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const read = (key: string) => byKey.get(key)?.value.trim() || null;
    const rawProvider = read(KEYS.provider);
    const rawApiKey = read(KEYS.apiKey);
    const secret = this.config.get<string>('JWT_REFRESH_SECRET')?.trim();

    return {
      stored: {
        provider: rawProvider && isAiProviderId(rawProvider) ? rawProvider : null,
        baseUrl: read(KEYS.baseUrl),
        // Не расшифровался (сменился секрет): считаем ключ не заданным, действует env.
        apiKey: rawApiKey && secret ? decryptSecret(rawApiKey, secret) : null,
        defaultModel: read(KEYS.defaultModel),
      },
      updatedAt:
        rows
          .map((row) => row.updatedAt)
          .sort((left, right) => right.getTime() - left.getTime())[0] ?? null,
    };
  }

  private async resolve() {
    const { stored, updatedAt } = await this.loadStored();

    try {
      return { settings: resolveAiProviderSettings(this.config, stored), updatedAt };
    } catch (error) {
      throw new ServiceUnavailableException(
        error instanceof Error ? error.message : 'AI provider is misconfigured',
      );
    }
  }

  /** Адрес и ключ провайдера для запроса. Без них запрос не уходит: 503 вместо обращения в сеть. */
  async getConnection(): Promise<AiProviderConnection> {
    const { settings } = await this.resolve();

    if (!settings.baseUrl) {
      throw new ServiceUnavailableException(
        `AI base URL is required for provider ${settings.provider}`,
      );
    }

    if (!settings.apiKey) {
      throw new ServiceUnavailableException('AI API key is not configured on server');
    }

    return { ...settings, baseUrl: settings.baseUrl, apiKey: settings.apiKey };
  }

  private toSettingsResponse(
    settings: AiProviderSettings & { apiKeySource: string },
    updatedAt: Date | null,
  ) {
    return {
      aiProvider: {
        provider: settings.provider,
        label: settings.label,
        baseUrl: settings.baseUrl,
        defaultModel: settings.defaultModel,
        isConfigured: Boolean(settings.apiKey && settings.baseUrl),
        maskedValue: settings.apiKey ? this.maskApiKey(settings.apiKey) : null,
        source: settings.apiKeySource as 'DB' | 'ENV' | 'NONE',
        updatedAt: updatedAt ? updatedAt.toISOString() : null,
      },
    };
  }

  async getAiProviderSettings(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const { settings, updatedAt } = await this.resolve();

    return this.toSettingsResponse(settings, updatedAt);
  }

  async updateAiProviderSettings(userId: number, input: UpdateAiProviderInput) {
    await ensureAdminAccess(this.prisma, userId);

    const baseUrl = input.baseUrl?.trim() || null;
    const defaultModel = input.defaultModel?.trim() || null;
    const apiKey = input.apiKey?.trim() || null;

    if (!AI_PROVIDER_PRESETS[input.provider].defaultBaseUrl && !baseUrl) {
      throw new BadRequestException(`Base URL is required for provider ${input.provider}`);
    }

    const encryptedApiKey = apiKey ? encryptSecret(apiKey, this.getEncryptionSecret()) : null;
    // Неверный env не должен мешать исправить настройки отсюда.
    const before = await this.resolve().catch(() => null);

    await this.prisma.$transaction(async (tx) => {
      const save = (key: string, value: string | null) =>
        value
          ? tx.appSetting.upsert({ where: { key }, create: { key, value }, update: { value } })
          : tx.appSetting.deleteMany({ where: { key } });

      await save(KEYS.provider, input.provider);
      await save(KEYS.baseUrl, baseUrl);
      await save(KEYS.defaultModel, defaultModel);

      if (encryptedApiKey) {
        await save(KEYS.apiKey, encryptedApiKey);
      } else if (input.clearApiKey) {
        await save(KEYS.apiKey, null);
      }

      const after = resolveAiProviderSettings(this.config, {
        provider: input.provider,
        baseUrl,
        defaultModel,
        apiKey: encryptedApiKey
          ? apiKey
          : input.clearApiKey
            ? null
            : before?.settings.apiKeySource === 'DB'
              ? before.settings.apiKey
              : null,
      });
      const changes = collectAuditChanges(
        { ...before?.settings },
        { ...after },
        {
          fields: ['provider', 'baseUrl', 'defaultModel'],
          redactedFields: ['apiKey'],
        },
      );

      if (changes.length > 0) {
        await this.auditService.record(
          {
            entityType: 'APP_SETTING',
            entityId: AI_PROVIDER_AUDIT_ENTITY_ID,
            action: 'SETTING_UPDATED',
            actorUserId: userId,
            changes,
          },
          tx,
        );
      }
    });
  }
}
