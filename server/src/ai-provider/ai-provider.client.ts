import { createHash } from 'node:crypto';

import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessage,
} from 'openai/resources/chat/completions';

import { type AiProviderConnection, readFirstEnv } from './ai-provider.config';
import { type AiFailureReason, classifyAiFailure } from './ai-provider.failure';
import { type AiUsageContext, readCompletionUsage } from './ai-usage';
import { AiUsageService } from './ai-usage.service';
import {
  extractAiProviderErrorMessage,
  filterStructuredOutputPromptModels,
  parsePromptModels,
  resolveDefaultPromptModel,
} from './ai-provider.utils';

const DEFAULT_AI_TIMEOUT_MS = 120_000;

export const AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE = 'AI provider request timeout';

/** Пауза перед каждым повтором при 429/502/503/504; таймауты не повторяются (их повторяет вызывающий код). */
export const AI_PROVIDER_RETRY_DELAYS_MS = [2_000, 5_000] as const;
const RETRYABLE_STATUSES = new Set([429, 502, 503, 504]);
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

type OpenRouterProviderSort = 'price' | 'throughput' | 'latency';

/** Маршрутизация OpenRouter. Другим провайдерам не передаётся. */
interface OpenRouterProviderPreferences {
  order?: readonly string[];
  allow_fallbacks?: boolean;
  sort?: OpenRouterProviderSort;
  preferred_min_throughput?: number | OpenRouterPercentileThresholds;
  ignore?: readonly string[];
}

interface OpenRouterPercentileThresholds {
  p50?: number;
  p75?: number;
  p90?: number;
  p99?: number;
}

type OpenRouterProviderRequest = OpenRouterProviderPreferences & {
  require_parameters?: boolean;
};

export interface AiPromptUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  cost?: number;
}

export interface AiPromptResult {
  model: string;
  output: string;
  provider?: string;
  usage?: AiPromptUsage;
}

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
  /** OpenRouter: `session_id`, привязка запросов к одному провайдеру. Уникальный id снимает её. */
  sessionId?: string;
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
    session_id?: string;
  } = {
    model: dto.model,
    temperature: dto.temperature ?? 0.7,
    messages: [{ role: 'user', content: dto.prompt }],
  };
  const provider: OpenRouterProviderRequest = { ...(dto.provider ?? {}) };

  if (dto.sessionId && connection.supportsOpenRouterExtensions) {
    body.session_id = dto.sessionId;
  }

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

// `cause` keeps the SDK error: its HTTP status is what tells a revoked key from an outage.
const toProviderError = (error: unknown, label: string, timeoutMessage: string) => {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new BadGatewayException(timeoutMessage, {
      cause: error,
      description: 'AI_PROVIDER_TIMEOUT',
    });
  }

  if (error instanceof OpenAI.APIError) {
    return new BadGatewayException(
      extractAiProviderErrorMessage(error, `${label} request failed`),
      { cause: error, description: 'AI_PROVIDER_REQUEST_FAILED' },
    );
  }

  return error;
};

export type AiProviderHealth = {
  status: 'ok' | 'failed' | 'not_configured';
  checkedAt: string;
  errorMessage?: string;
};

/** Итог настоящего запроса к модели: ключ, баланс и сама модель, а не только каталог. */
export type AiProviderCompletionCheck = {
  status: 'ok' | 'failed';
  checkedAt: string;
  model: string;
  reason?: AiFailureReason;
  httpStatus?: number;
  errorMessage?: string;
};

export const AI_PROVIDER_COMPLETION_CHECK_TIMEOUT_MS = 20_000;
export const AI_PROVIDER_HEALTH_CHECK_TIMEOUT_MS = 5_000;
export const AI_PROVIDER_HEALTH_CHECK_CACHE_TTL_MS = 30_000;
export const AI_PROVIDER_MODELS_CACHE_TTL_MS = 5 * 60_000;

export interface AiModelCatalog {
  defaultModel: string;
  models: ReturnType<typeof parsePromptModels>;
}

/**
 * Клиент OpenAI-совместимого API на официальном OpenAI SDK. Провайдер выбирается настройками
 * (`AiProviderConfigService.getConnection`): SDK получает `baseURL` и ключ, остальное одинаково.
 * Повторы SDK выключены: таймауты повторяет вызывающий код, а перегрузку провайдера (429/502/503/504)
 * `generatePrompt` повторяет сам с паузой.
 */
@Injectable()
export class AiProviderClientService {
  private healthCache = new Map<string, { result: AiProviderHealth; cachedAt: number }>();
  private modelsCache = new Map<string, { catalog: AiModelCatalog; cachedAt: number }>();

  constructor(
    private readonly config: ConfigService,
    private readonly usage: AiUsageService,
  ) {}

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

  /**
   * Каталог моделей кэшируется на 5 минут: он нужен каждому анализу и списку в админке. Ключ кэша —
   * адрес и хэш ключа, поэтому смена любого из них сразу даёт свежий каталог. `fresh` пропускает чтение.
   */
  async fetchModels(
    connection: AiProviderConnection,
    options?: { timeoutMs?: number; fresh?: boolean },
  ): Promise<AiModelCatalog> {
    const keyHash = createHash('sha256').update(connection.apiKey).digest('hex');
    const cacheKey = `${connection.baseUrl}\n${keyHash}`;
    const cached = this.modelsCache.get(cacheKey);
    if (
      !options?.fresh &&
      cached &&
      Date.now() - cached.cachedAt < AI_PROVIDER_MODELS_CACHE_TTL_MS
    ) {
      return cached.catalog;
    }

    const catalog = await this.loadModels(connection, options?.timeoutMs);
    this.modelsCache.set(cacheKey, { catalog, cachedAt: Date.now() });
    return catalog;
  }

  private async loadModels(connection: AiProviderConnection, timeoutMs?: number) {
    const client = this.createClient(connection, timeoutMs ?? this.resolveTimeoutMs());

    try {
      const page = await client.models.list(
        connection.modelsQuery ? { query: connection.modelsQuery } : undefined,
      );
      const models = filterStructuredOutputPromptModels(parsePromptModels(page.data));

      if (models.length === 0) {
        throw new BadGatewayException(
          `${connection.label} returned no structured output models`,
          'AI_PROVIDER_NO_STRUCTURED_MODELS',
        );
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
   * Достижимость провайдера для бейджа в настройках. Каталог моделей запрашивается с коротким
   * таймаутом (5с) и кэшируется на 30с, чтобы медленный внешний провайдер не блокировал админку.
   * Каталог Polza отдаёт и без валидного ключа, поэтому «ok» здесь не говорит ни о ключе, ни о
   * балансе: их проверяет `checkCompletion`.
   */
  async checkHealth(connection: AiProviderConnection): Promise<AiProviderHealth> {
    const cacheKey = `${connection.baseUrl}\n${connection.apiKey}`;
    const now = Date.now();
    const cached = this.healthCache.get(cacheKey);
    if (cached && now - cached.cachedAt < AI_PROVIDER_HEALTH_CHECK_CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      await this.fetchModels(connection, {
        timeoutMs: AI_PROVIDER_HEALTH_CHECK_TIMEOUT_MS,
        fresh: true,
      });

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

  /**
   * Настоящая проверка: один запрос к модели на один токен, только по действию админа (платный).
   * Без повторов и кэша: ответ нужен таким, какой он есть сейчас. Текст ошибки провайдера
   * показывается админу, но ключ из него вычищается.
   */
  async checkCompletion(
    connection: AiProviderConnection,
    actorUserId?: number,
  ): Promise<AiProviderCompletionCheck> {
    const client = this.createClient(connection, AI_PROVIDER_COMPLETION_CHECK_TIMEOUT_MS);
    const context: AiUsageContext = { purpose: 'CONNECTION_CHECK', actorUserId };
    let model = connection.defaultModel ?? 'unknown';
    const startedAt = Date.now();

    try {
      model = connection.defaultModel ?? (await this.fetchModels(connection)).defaultModel;
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1,
        temperature: 0,
      });
      await this.recordUsage(connection, model, context, startedAt, completion);

      return { status: 'ok', checkedAt: new Date().toISOString(), model };
    } catch (error) {
      const wrapped = toProviderError(error, connection.label, AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE);
      const failure = classifyAiFailure(wrapped);
      await this.recordUsage(connection, model, context, startedAt, undefined, failure.reason);
      const message =
        wrapped instanceof Error ? wrapped.message : `${connection.label} check failed`;

      return {
        status: 'failed',
        checkedAt: new Date().toISOString(),
        model,
        reason: failure.reason,
        ...(failure.httpStatus === undefined ? {} : { httpStatus: failure.httpStatus }),
        errorMessage: connection.apiKey ? message.split(connection.apiKey).join('***') : message,
      };
    }
  }

  private async createCompletionWithRetry(
    client: OpenAI,
    body: ReturnType<typeof buildPromptRequestBody>['body'],
  ) {
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await client.chat.completions.create(body);
      } catch (error) {
        const delay = AI_PROVIDER_RETRY_DELAYS_MS[attempt];
        const retryable =
          error instanceof OpenAI.APIError &&
          typeof error.status === 'number' &&
          RETRYABLE_STATUSES.has(error.status);

        if (!retryable || delay === undefined) {
          throw error;
        }

        await sleep(delay);
      }
    }
  }

  /**
   * Записывает расход вызова: токены, стоимость и фактическую модель. Здесь, а не у вызывающих,
   * потому что тут уже есть ответ провайдера и сюда попадают все платные вызовы, включая неудачные.
   * Сбой записи не прерывает вызов (`AiUsageService.record` его не пробрасывает).
   */
  private recordUsage(
    connection: AiProviderConnection,
    requestedModel: string,
    context: AiUsageContext,
    startedAt: number,
    completion: unknown,
    failureReason?: AiFailureReason,
  ) {
    return this.usage.record({
      ...context,
      ...readCompletionUsage(completion),
      status: failureReason ? 'FAILED' : 'SUCCESS',
      provider: connection.provider,
      requestedModel,
      durationMs: Date.now() - startedAt,
      failureReason,
    });
  }

  /**
   * `options.usage` обязателен: вызов без вида в учёт не попадёт, а компилятор не даёт его забыть.
   * В учёт идёт один вызов целиком; внутренние повторы 429/5xx не оплачиваются и отдельно не пишутся.
   */
  async generatePrompt(
    connection: AiProviderConnection,
    dto: AiPromptRequest,
    options: { timeoutMs?: number; usage: AiUsageContext },
  ): Promise<AiPromptResult> {
    const client = this.createClient(connection, this.resolveTimeoutMs(options.timeoutMs));
    const { body, responseFormat } = buildPromptRequestBody(dto, connection);
    const startedAt = Date.now();
    let completion: ChatCompletion | undefined;

    try {
      completion = await this.createCompletionWithRetry(client, body);
      const output = extractCompletionOutput(completion.choices?.[0]?.message);

      if (!output) {
        throw new BadGatewayException(
          `${connection.label} returned an empty response`,
          'AI_PROVIDER_EMPTY_RESPONSE',
        );
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

      const meta = completion as { provider?: unknown; usage?: AiPromptUsage };
      await this.recordUsage(connection, dto.model, options.usage, startedAt, completion);

      return {
        model: dto.model,
        output: formattedOutput,
        provider: typeof meta.provider === 'string' ? meta.provider : undefined,
        usage: meta.usage,
      };
    } catch (error) {
      const wrapped = toProviderError(error, connection.label, AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE);
      // Пустой ответ провайдер уже оплатил: токены и стоимость берём из него, даже если вызов неудачный.
      await this.recordUsage(
        connection,
        dto.model,
        options.usage,
        startedAt,
        completion,
        classifyAiFailure(wrapped).reason,
      );
      throw wrapped;
    }
  }
}
