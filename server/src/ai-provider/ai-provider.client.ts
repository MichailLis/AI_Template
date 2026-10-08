import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
} from 'openai/resources/chat/completions';

import { type AiProviderConnection, readFirstEnv } from './ai-provider.config';
import {
  extractAiProviderErrorMessage,
  filterStructuredOutputPromptModels,
  parsePromptModels,
  resolveDefaultPromptModel,
} from './ai-provider.utils';

const DEFAULT_AI_TIMEOUT_MS = 120_000;

export const AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE = 'AI provider request timeout';

type OpenRouterProviderSort = 'price' | 'throughput' | 'latency';

/** Маршрутизация OpenRouter. Другим провайдерам не передаётся. */
interface OpenRouterProviderPreferences {
  order?: readonly string[];
  allow_fallbacks?: boolean;
  sort?: OpenRouterProviderSort;
}

type OpenRouterProviderRequest = OpenRouterProviderPreferences & {
  require_parameters?: boolean;
};

export interface AiPromptRequest {
  model: string;
  prompt: string;
  temperature?: number;
  responseFormat?: 'text' | 'json';
  responseSchema?: {
    name?: string;
    strict?: boolean;
    schema: Record<string, unknown>;
  };
  /** OpenRouter: `provider.require_parameters`. */
  requireParameters?: boolean;
  /** OpenRouter: плагин `response-healing`. */
  useResponseHealing?: boolean;
  /** OpenRouter: предпочтения маршрутизации. */
  provider?: OpenRouterProviderPreferences;
}

export const resolveAiTimeoutMs = (config: ConfigService, timeoutMs?: number) => {
  if (Number.isFinite(timeoutMs) && timeoutMs && timeoutMs > 0) {
    return timeoutMs;
  }

  const rawValue = readFirstEnv(config, ['AI_TIMEOUT_MS', 'OPENROUTER_TIMEOUT_MS']);
  const parsedValue =
    typeof rawValue === 'number' ? rawValue : typeof rawValue === 'string' ? Number(rawValue) : NaN;

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : DEFAULT_AI_TIMEOUT_MS;
};

const buildDefaultHeaders = (
  config: ConfigService,
  connection: AiProviderConnection,
): Record<string, string> =>
  connection.supportsOpenRouterExtensions
    ? {
        'HTTP-Referer': config.get<string>('OPENROUTER_HTTP_REFERER') ?? 'http://localhost:5173',
        'X-Title': config.get<string>('OPENROUTER_APP_NAME') ?? 'AI Template Admin',
      }
    : {};

/**
 * Тело запроса Chat Completions. Расширения OpenRouter (`provider`, `plugins`) добавляются только
 * для провайдера, который их понимает: строгий OpenAI-совместимый сервис отвечает 400 на
 * незнакомые поля.
 */
export const buildPromptRequestBody = (
  dto: AiPromptRequest,
  connection: Pick<AiProviderConnection, 'supportsOpenRouterExtensions'>,
) => {
  const responseFormat = dto.responseFormat ?? 'text';
  const body: ChatCompletionCreateParamsNonStreaming & {
    provider?: OpenRouterProviderRequest;
    plugins?: Array<{ id: 'response-healing' }>;
  } = {
    model: dto.model,
    temperature: dto.temperature ?? 0.7,
    messages: [{ role: 'user', content: dto.prompt }],
  };
  const provider: OpenRouterProviderRequest = { ...(dto.provider ?? {}) };

  if (responseFormat === 'json') {
    body.response_format = dto.responseSchema
      ? {
          type: 'json_schema',
          json_schema: {
            name: dto.responseSchema.name ?? 'structured_output',
            strict: dto.responseSchema.strict ?? true,
            schema: dto.responseSchema.schema,
          },
        }
      : { type: 'json_object' };

    if (dto.requireParameters ?? Boolean(dto.responseSchema)) {
      provider.require_parameters = true;
    }

    if (
      connection.supportsOpenRouterExtensions &&
      (dto.useResponseHealing ?? Boolean(dto.responseSchema))
    ) {
      body.plugins = [{ id: 'response-healing' }];
    }
  }

  if (connection.supportsOpenRouterExtensions && Object.keys(provider).length > 0) {
    body.provider = provider;
  }

  return { body, responseFormat };
};

const extractCompletionOutput = (message: ChatCompletionMessage | undefined) => {
  const rawContent: unknown = message?.content;

  return typeof rawContent === 'string'
    ? rawContent
    : Array.isArray(rawContent)
      ? rawContent
          .map((chunk: { text?: string }) => chunk.text ?? '')
          .join('')
          .trim()
      : '';
};

const toProviderError = (error: unknown, label: string, timeoutMessage: string) => {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new BadGatewayException(timeoutMessage);
  }

  if (error instanceof OpenAI.APIError) {
    return new BadGatewayException(extractAiProviderErrorMessage(error, `${label} request failed`));
  }

  return error;
};

export type AiProviderHealth = {
  status: 'ok' | 'failed' | 'not_configured';
  checkedAt: string;
  errorMessage?: string;
};

export const AI_PROVIDER_HEALTH_CHECK_TIMEOUT_MS = 5_000;
export const AI_PROVIDER_HEALTH_CHECK_CACHE_TTL_MS = 30_000;

/**
 * Клиент OpenAI-совместимого API на официальном OpenAI SDK. Провайдер выбирается настройками
 * (`AiProviderConfigService.getConnection`): SDK получает `baseURL` и ключ, остальное одинаково.
 * Повторы SDK выключены: таймауты и повторы задаются вызывающим кодом.
 */
@Injectable()
export class AiProviderClientService {
  private healthCache = new Map<string, { result: AiProviderHealth; cachedAt: number }>();

  constructor(private readonly config: ConfigService) {}

  private createClient(connection: AiProviderConnection, timeoutMs: number) {
    return new OpenAI({
      apiKey: connection.apiKey,
      baseURL: connection.baseUrl,
      timeout: timeoutMs,
      maxRetries: 0,
      defaultHeaders: buildDefaultHeaders(this.config, connection),
    });
  }

  resolveTimeoutMs(timeoutMs?: number) {
    return resolveAiTimeoutMs(this.config, timeoutMs);
  }

  async fetchModels(connection: AiProviderConnection, options?: { timeoutMs?: number }) {
    const client = this.createClient(connection, options?.timeoutMs ?? this.resolveTimeoutMs());

    try {
      const page = await client.models.list(
        connection.modelsQuery ? { query: connection.modelsQuery } : undefined,
      );
      const models = filterStructuredOutputPromptModels(parsePromptModels(page.data));

      if (models.length === 0) {
        throw new BadGatewayException(`${connection.label} returned no structured output models`);
      }

      return {
        defaultModel: resolveDefaultPromptModel(models, connection.defaultModel ?? undefined),
        models,
      };
    } catch (error) {
      throw toProviderError(
        error,
        connection.label,
        `${connection.label} model catalog request timeout`,
      );
    }
  }

  /**
   * Проверка связи для экрана настроек. Каталог моделей запрашивается с коротким таймаутом (5с)
   * и кэшируется на 30с, чтобы медленный или фильтруемый внешний провайдер не блокировал админку.
   */
  async checkHealth(connection: AiProviderConnection): Promise<AiProviderHealth> {
    const cacheKey = `${connection.baseUrl}\n${connection.apiKey}`;
    const now = Date.now();
    const cached = this.healthCache.get(cacheKey);
    if (cached && now - cached.cachedAt < AI_PROVIDER_HEALTH_CHECK_CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      await this.fetchModels(connection, { timeoutMs: AI_PROVIDER_HEALTH_CHECK_TIMEOUT_MS });

      const result: AiProviderHealth = { status: 'ok', checkedAt: new Date().toISOString() };
      this.healthCache.set(cacheKey, { result, cachedAt: now });
      return result;
    } catch (error) {
      return {
        status: 'failed',
        checkedAt: new Date().toISOString(),
        errorMessage:
          error instanceof Error ? error.message : `${connection.label} connection check failed`,
      };
    }
  }

  async generatePrompt(
    connection: AiProviderConnection,
    dto: AiPromptRequest,
    options?: { timeoutMs?: number },
  ) {
    const client = this.createClient(connection, this.resolveTimeoutMs(options?.timeoutMs));
    const { body, responseFormat } = buildPromptRequestBody(dto, connection);

    try {
      const completion = await client.chat.completions.create(body);
      const output = extractCompletionOutput(completion.choices?.[0]?.message);

      if (!output) {
        throw new BadGatewayException(`${connection.label} returned an empty response`);
      }

      const formattedOutput =
        responseFormat === 'json'
          ? (() => {
              try {
                return JSON.stringify(JSON.parse(output), null, 2);
              } catch {
                return output;
              }
            })()
          : output;

      return {
        model: dto.model,
        output: formattedOutput,
      };
    } catch (error) {
      throw toProviderError(error, connection.label, AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE);
    }
  }
}
