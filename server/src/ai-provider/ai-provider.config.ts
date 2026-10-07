import type { ConfigService } from '@nestjs/config';

/**
 * Провайдер ИИ — любой сервис с OpenAI-совместимым API (`/chat/completions`, `/models`). Пресет
 * задаёт адрес по умолчанию и то, какие расширения протокола провайдер понимает; адрес всегда
 * можно переопределить через `AI_BASE_URL`.
 *
 * - `polza` — polza.ai, провайдер по умолчанию.
 * - `openrouter` — OpenRouter. Только ему уходят его расширения: `provider` (маршрутизация и
 *   `require_parameters`), плагин `response-healing` и заголовки атрибуции.
 * - `openai-compatible` — любой другой OpenAI-совместимый сервис; `AI_BASE_URL` обязателен.
 *   Запрос содержит только поля стандартного Chat Completions API.
 */
export const AI_PROVIDER_IDS = ['polza', 'openrouter', 'openai-compatible'] as const;

export type AiProviderId = (typeof AI_PROVIDER_IDS)[number];

interface AiProviderPreset {
  label: string;
  defaultBaseUrl: string | null;
  /** Провайдер понимает расширения OpenRouter: `provider`, `plugins` и заголовки атрибуции. */
  supportsOpenRouterExtensions: boolean;
  /** Query для `GET /models`, оставляющий в каталоге только текстовые модели. */
  modelsQuery?: Record<string, string>;
}

export const AI_PROVIDER_PRESETS: Record<AiProviderId, AiProviderPreset> = {
  polza: {
    label: 'Polza.ai',
    defaultBaseUrl: 'https://polza.ai/api/v1',
    supportsOpenRouterExtensions: false,
    modelsQuery: { type: 'chat' },
  },
  openrouter: {
    label: 'OpenRouter',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    supportsOpenRouterExtensions: true,
  },
  'openai-compatible': {
    label: 'OpenAI-совместимый API',
    defaultBaseUrl: null,
    supportsOpenRouterExtensions: false,
  },
};

export const DEFAULT_AI_PROVIDER: AiProviderId = 'polza';

export interface AiProviderSettings {
  provider: AiProviderId;
  label: string;
  baseUrl: string | null;
  apiKey: string | null;
  defaultModel: string | null;
  supportsOpenRouterExtensions: boolean;
  modelsQuery?: Record<string, string>;
}

/** Настройки, по которым уже можно сделать запрос: адрес и ключ заданы. */
export type AiProviderConnection = AiProviderSettings & { baseUrl: string; apiKey: string };

const readString = (config: ConfigService, name: string) =>
  config.get<string>(name)?.trim() || null;

/**
 * Первое заданное значение из списка имён. Переменные `OPENROUTER_*` остались запасными именами,
 * чтобы окружение, настроенное до появления `AI_*`, продолжало работать без правок.
 */
export const readFirstEnv = (config: ConfigService, names: readonly string[]) => {
  for (const name of names) {
    const value = config.get<string | number>(name);

    if (typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0)) {
      return value;
    }
  }

  return undefined;
};

export const isAiProviderId = (value: string): value is AiProviderId =>
  (AI_PROVIDER_IDS as readonly string[]).includes(value);

/**
 * `AI_PROVIDER` не задан: по умолчанию polza.ai. Исключение — старое окружение, где задан только
 * `OPENROUTER_API_KEY`: оно продолжает ходить в OpenRouter, пока не появится `AI_API_KEY`.
 */
const resolveProviderId = (config: ConfigService): AiProviderId => {
  const rawProvider = readString(config, 'AI_PROVIDER')?.toLowerCase();

  if (rawProvider) {
    if (!isAiProviderId(rawProvider)) {
      throw new Error(
        `AI_PROVIDER must be one of ${AI_PROVIDER_IDS.join(', ')}; received "${rawProvider}"`,
      );
    }

    return rawProvider;
  }

  if (!readString(config, 'AI_API_KEY') && readString(config, 'OPENROUTER_API_KEY')) {
    return 'openrouter';
  }

  return DEFAULT_AI_PROVIDER;
};

export const resolveAiProviderSettings = (config: ConfigService): AiProviderSettings => {
  const provider = resolveProviderId(config);
  const preset = AI_PROVIDER_PRESETS[provider];
  const isOpenRouter = provider === 'openrouter';
  const legacy = (name: string) => (isOpenRouter ? readString(config, `OPENROUTER_${name}`) : null);

  return {
    provider,
    label: preset.label,
    baseUrl: readString(config, 'AI_BASE_URL')?.replace(/\/+$/, '') || preset.defaultBaseUrl,
    apiKey: readString(config, 'AI_API_KEY') ?? legacy('API_KEY'),
    defaultModel: readString(config, 'AI_DEFAULT_MODEL') ?? legacy('DEFAULT_MODEL'),
    supportsOpenRouterExtensions: preset.supportsOpenRouterExtensions,
    ...(preset.modelsQuery ? { modelsQuery: preset.modelsQuery } : {}),
  };
};
