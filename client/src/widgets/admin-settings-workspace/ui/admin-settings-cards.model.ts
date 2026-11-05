import { formatDateTime } from '@/shared/lib/date-format';

import type {
  AdminAiProviderCheckResponseDto,
  AdminAiProviderCheckResponseDtoReason,
  AdminAiProviderSettingsResponseDto,
  AdminPrivacyPolicySettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
} from '@/shared/api/model';

export type AiProviderSettings = AdminAiProviderSettingsResponseDto['aiProvider'];
export type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];
export type ProfessionAtlasCoverage = NonNullable<ProfessionAtlasSettings['coverage']>;
export type PrivacyPolicySettings = AdminPrivacyPolicySettingsResponseDto['privacyPolicy'];

export const sourceLabels: Record<AiProviderSettings['source'], string> = {
  DB: 'Админ-панель',
  ENV: 'Переменная окружения',
  NONE: 'Не задан',
};

export const atlasCoverageStatusLabels: Record<ProfessionAtlasCoverage['status'], string> = {
  ready: 'Готов',
  partial: 'Частично',
  unavailable: 'Недоступен',
};

export const atlasCoverageItemStatusLabels: Record<
  ProfessionAtlasCoverage['items'][number]['status'],
  string
> = {
  found: 'найдено',
  missing: 'не найдено',
  duplicate: 'дубли',
};

export type AiProviderCheck = AdminAiProviderCheckResponseDto;

/**
 * Что значит отказ настоящего запроса к модели и что делать. Текст самого провайдера показывается
 * отдельной строкой: он точнее, но по-английски и не всегда понятен без подсказки.
 */
export const aiCheckReasonLabels: Record<AdminAiProviderCheckResponseDtoReason, string> = {
  AUTH: 'Провайдер не принял ключ: он отозван, неверен или выпущен для другого адреса.',
  PAYMENT: 'На балансе провайдера не хватает средств: пополните баланс.',
  RATE_LIMITED: 'Провайдер ограничил число запросов. Повторите проверку позже.',
  PROVIDER_ERROR: 'Сервис провайдера сейчас недоступен. Повторите проверку позже.',
  TIMEOUT: 'Провайдер не ответил за отведённое время.',
  NETWORK: 'Не удалось соединиться с провайдером: проверьте адрес API и сеть сервера.',
  MODEL_UNAVAILABLE: 'У провайдера нет этой модели. Укажите другую модель по умолчанию.',
  BAD_REQUEST: 'Провайдер отклонил пробный запрос.',
  NOT_CONFIGURED: 'Провайдер не настроен: проверьте адрес и ключ.',
  INVALID_RESPONSE: 'Провайдер ответил непонятным образом.',
  UNKNOWN: 'Проверка не удалась по неизвестной причине.',
};

export type IntegrationHealthTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface IntegrationHealthBadge {
  label: string;
  tone: IntegrationHealthTone;
}

export interface IntegrationHealthOptions {
  /**
   * Запрос настроек упал. Без данных шапка иначе навсегда застревала на «проверяем связь». Если
   * данные уже есть (упал только повторный запрос), показывается последний известный результат.
   */
  isError?: boolean;
  /** Покрытие атласа грузится отдельным запросом и приходит позже настроек. */
  isChecking?: boolean;
}

const withCheckTime = (label: string, checkedAt: string) =>
  `${label} · ${formatDateTime(checkedAt)}`;

/**
 * Бейдж в шапке отвечает на вопрос «отвечает ли провайдер», а не «задан ли ключ». Раньше
 * «OpenRouter готов» показывался по одному наличию ключа и оставался зелёным при упавшем сервисе.
 * Отказ провайдера ИИ — danger: без него не работает ИИ-анализ. Но проверка при открытии настроек
 * бесплатная и видит только каталог моделей: Polza отдаёт его и без валидного ключа. Поэтому бейдж
 * не говорит «работает»: ключ и баланс проверяет кнопка «Проверить ключ и баланс». Бейдж называет
 * подключённого провайдера (Polza.ai, OpenRouter, …), пока настройки не загружены — «ИИ».
 */
export const getAiProviderHealthBadge = (
  aiProvider: AiProviderSettings | undefined,
  { isError = false }: IntegrationHealthOptions = {},
): IntegrationHealthBadge => {
  if (!aiProvider) {
    return isError
      ? { label: 'ИИ: не удалось проверить', tone: 'danger' }
      : { label: 'ИИ: проверяем связь', tone: 'neutral' };
  }

  const { health, label } = aiProvider;

  if (health.status === 'ok') {
    return {
      label: withCheckTime(`${label}: каталог моделей отвечает`, health.checkedAt),
      tone: 'success',
    };
  }

  if (health.status === 'failed') {
    return { label: withCheckTime(`${label} недоступен`, health.checkedAt), tone: 'danger' };
  }

  return { label: `${label}: ключ не задан`, tone: 'warning' };
};

/**
 * Состояние атласа берётся из проверки покрытия, которую воркспейс догружает отдельным запросом. По
 * решению Q6 атлас необязателен и только обогащает результат, поэтому даже полная недоступность —
 * предупреждение, а не авария.
 */
export const getProfessionAtlasHealthBadge = (
  professionAtlas: ProfessionAtlasSettings | undefined,
  { isError = false, isChecking = false }: IntegrationHealthOptions = {},
): IntegrationHealthBadge => {
  if (!professionAtlas) {
    return isError
      ? { label: 'Атлас: не удалось проверить', tone: 'warning' }
      : { label: 'Атлас: проверяем связь', tone: 'neutral' };
  }

  const isConfigured = Boolean(
    (professionAtlas.publicUrl ?? professionAtlas.url) && professionAtlas.apiUrl,
  );

  if (!isConfigured) {
    return { label: 'Атлас не задан', tone: 'neutral' };
  }

  const { coverage } = professionAtlas;

  if (!coverage) {
    return isChecking
      ? { label: 'Атлас: проверяем связь', tone: 'neutral' }
      : { label: 'Атлас не проверен', tone: 'neutral' };
  }

  if (coverage.status === 'ready') {
    return { label: withCheckTime('Атлас работает', coverage.checkedAt), tone: 'success' };
  }

  if (coverage.status === 'partial') {
    return {
      label: withCheckTime('Атлас работает частично', coverage.checkedAt),
      tone: 'warning',
    };
  }

  return { label: withCheckTime('Атлас недоступен', coverage.checkedAt), tone: 'warning' };
};

export const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return 'не обновлялся через админку';
  }

  return formatDateTime(value);
};

export const formatAtlasErrorMessage = (message: string | null | undefined): string | null => {
  if (!message) {
    return null;
  }
  if (message === 'fetch failed' || message.includes('fetch failed')) {
    return 'Сервис Атласа не отвечает';
  }
  return message;
};
