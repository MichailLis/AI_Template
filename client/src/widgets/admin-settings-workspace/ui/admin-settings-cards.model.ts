import { formatDateTime } from '@/shared/lib/date-format';

import type {
  AdminOpenRouterSettingsResponseDto,
  AdminPrivacyPolicySettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
} from '@/shared/api/model';

export type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];
export type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];
export type ProfessionAtlasCoverage = NonNullable<ProfessionAtlasSettings['coverage']>;
export type PrivacyPolicySettings = AdminPrivacyPolicySettingsResponseDto['privacyPolicy'];

export const sourceLabels: Record<OpenRouterSettings['source'], string> = {
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
}

const withCheckTime = (label: string, checkedAt: string) =>
  `${label} · ${formatDateTime(checkedAt)}`;

/**
 * Бейдж в шапке отвечает на вопрос «работает ли», а не «задан ли ключ». Раньше «OpenRouter готов»
 * показывался по одному наличию ключа и оставался зелёным при отозванном ключе или упавшем
 * сервисе. Отказ OpenRouter — danger: без него не работает ИИ-анализ.
 */
export const getOpenRouterHealthBadge = (
  openRouter: OpenRouterSettings | undefined,
  { isError = false }: IntegrationHealthOptions = {},
): IntegrationHealthBadge => {
  if (!openRouter) {
    return isError
      ? { label: 'OpenRouter: не удалось проверить', tone: 'danger' }
      : { label: 'OpenRouter: проверяем связь', tone: 'neutral' };
  }

  const { health } = openRouter;

  if (health.status === 'ok') {
    return { label: withCheckTime('OpenRouter работает', health.checkedAt), tone: 'success' };
  }

  if (health.status === 'failed') {
    return { label: withCheckTime('OpenRouter недоступен', health.checkedAt), tone: 'danger' };
  }

  return { label: 'OpenRouter: ключ не задан', tone: 'warning' };
};

/**
 * Состояние атласа берётся из проверки покрытия, которая уже приходит вместе с настройками. По
 * решению Q6 атлас необязателен и только обогащает результат, поэтому даже полная недоступность —
 * предупреждение, а не авария.
 */
export const getProfessionAtlasHealthBadge = (
  professionAtlas: ProfessionAtlasSettings | undefined,
  { isError = false }: IntegrationHealthOptions = {},
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
    return { label: 'Атлас не проверен', tone: 'neutral' };
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
