import { describe, expect, it } from 'vitest';

import { formatDateTime } from '@/shared/lib/date-format';

import {
  formatAtlasErrorMessage,
  getAiProviderHealthBadge,
  getProfessionAtlasHealthBadge,
  type AiProviderSettings,
  type ProfessionAtlasSettings,
} from './admin-settings-cards.model';

const CHECKED_AT = '2026-09-12T20:05:00.000Z';

const createAiProvider = (
  health: AiProviderSettings['health'],
  overrides: Partial<AiProviderSettings> = {},
): AiProviderSettings => ({
  provider: 'openrouter',
  label: 'OpenRouter',
  baseUrl: 'https://openrouter.ai/api/v1',
  defaultModel: null,
  isConfigured: health.status !== 'not_configured',
  maskedValue: health.status === 'not_configured' ? null : 'sk-or-v1...cret',
  source: health.status === 'not_configured' ? 'NONE' : 'ENV',
  updatedAt: null,
  health,
  ...overrides,
});

const createAtlas = (
  coverageStatus: 'ready' | 'partial' | 'unavailable' | null,
  overrides: Partial<ProfessionAtlasSettings> = {},
): ProfessionAtlasSettings => ({
  url: 'https://atlas.example',
  publicUrl: 'https://atlas.example',
  apiUrl: 'https://atlas.example/api-backend',
  updatedAt: null,
  coverage:
    coverageStatus === null
      ? null
      : {
          status: coverageStatus,
          checkedAt: CHECKED_AT,
          total: 12,
          found: coverageStatus === 'ready' ? 12 : 0,
          missing: [],
          duplicates: [],
          items: [],
        },
  ...overrides,
});

/**
 * Находка аудита UX-02: в шапке настроек стояло «OpenRouter готов» и «Атлас подключен», а ниже на
 * той же странице — «Недоступен · fetch failed». Бейдж обязан отражать результат проверки.
 */
describe('getAiProviderHealthBadge', () => {
  it('reports a working connection with the check time', () => {
    expect(
      getAiProviderHealthBadge(createAiProvider({ status: 'ok', checkedAt: CHECKED_AT })),
    ).toEqual({
      label: `OpenRouter работает · ${formatDateTime(CHECKED_AT)}`,
      tone: 'success',
    });
  });

  it('names the configured provider in the badge', () => {
    expect(
      getAiProviderHealthBadge(
        createAiProvider(
          { status: 'ok', checkedAt: CHECKED_AT },
          { provider: 'polza', label: 'Polza.ai', baseUrl: 'https://polza.ai/api/v1' },
        ),
      ),
    ).toEqual({
      label: `Polza.ai работает · ${formatDateTime(CHECKED_AT)}`,
      tone: 'success',
    });
  });

  it('reports a configured but unreachable OpenRouter as unavailable, not ready', () => {
    expect(
      getAiProviderHealthBadge(
        createAiProvider({
          status: 'failed',
          checkedAt: CHECKED_AT,
          errorMessage: 'User not found.',
        }),
      ),
    ).toEqual({
      label: `OpenRouter недоступен · ${formatDateTime(CHECKED_AT)}`,
      tone: 'danger',
    });
  });

  it('asks for a key when none is configured', () => {
    expect(
      getAiProviderHealthBadge(
        createAiProvider({ status: 'not_configured', checkedAt: CHECKED_AT }),
      ),
    ).toEqual({ label: 'OpenRouter: ключ не задан', tone: 'warning' });
  });

  it('does not claim anything while the settings are still loading', () => {
    expect(getAiProviderHealthBadge(undefined)).toEqual({
      label: 'ИИ: проверяем связь',
      tone: 'neutral',
    });
  });

  /**
   * Без этого упавший запрос настроек навсегда оставлял в шапке «проверяем связь» — то есть
   * обещание проверки, которой не будет.
   */
  it('says the check could not be done when the settings request failed', () => {
    expect(getAiProviderHealthBadge(undefined, { isError: true })).toEqual({
      label: 'ИИ: не удалось проверить',
      tone: 'danger',
    });
  });

  it('keeps the last known result when only a refetch failed', () => {
    expect(
      getAiProviderHealthBadge(createAiProvider({ status: 'ok', checkedAt: CHECKED_AT }), {
        isError: true,
      }),
    ).toEqual({
      label: `OpenRouter работает · ${formatDateTime(CHECKED_AT)}`,
      tone: 'success',
    });
  });
});

describe('getProfessionAtlasHealthBadge', () => {
  it('reports a working atlas with the check time', () => {
    expect(getProfessionAtlasHealthBadge(createAtlas('ready'))).toEqual({
      label: `Атлас работает · ${formatDateTime(CHECKED_AT)}`,
      tone: 'success',
    });
  });

  it('reports partial coverage as a warning', () => {
    expect(getProfessionAtlasHealthBadge(createAtlas('partial'))).toEqual({
      label: `Атлас работает частично · ${formatDateTime(CHECKED_AT)}`,
      tone: 'warning',
    });
  });

  /**
   * Решение Q6: атлас необязателен и только обогащает результат, поэтому его недоступность —
   * предупреждение, а не авария.
   */
  it('reports an unreachable atlas as unavailable with a warning, not as connected', () => {
    expect(getProfessionAtlasHealthBadge(createAtlas('unavailable'))).toEqual({
      label: `Атлас недоступен · ${formatDateTime(CHECKED_AT)}`,
      tone: 'warning',
    });
  });

  it('says the atlas is not set when its addresses are missing', () => {
    expect(
      getProfessionAtlasHealthBadge(
        createAtlas(null, { url: null, publicUrl: null, apiUrl: null }),
      ),
    ).toEqual({ label: 'Атлас не задан', tone: 'neutral' });
  });

  it('does not claim the atlas works when no coverage check came back', () => {
    expect(getProfessionAtlasHealthBadge(createAtlas(null))).toEqual({
      label: 'Атлас не проверен',
      tone: 'neutral',
    });
  });

  it('does not claim anything while the settings are still loading', () => {
    expect(getProfessionAtlasHealthBadge(undefined)).toEqual({
      label: 'Атлас: проверяем связь',
      tone: 'neutral',
    });
  });

  it('says the check could not be done when the settings request failed', () => {
    expect(getProfessionAtlasHealthBadge(undefined, { isError: true })).toEqual({
      label: 'Атлас: не удалось проверить',
      tone: 'warning',
    });
  });

  it('keeps the last known result when only a refetch failed', () => {
    expect(getProfessionAtlasHealthBadge(createAtlas('ready'), { isError: true })).toEqual({
      label: `Атлас работает · ${formatDateTime(CHECKED_AT)}`,
      tone: 'success',
    });
  });
});

describe('formatAtlasErrorMessage', () => {
  it('translates fetch failed to user-friendly text', () => {
    expect(formatAtlasErrorMessage('fetch failed')).toBe('Сервис Атласа не отвечает');
    expect(formatAtlasErrorMessage('TypeError: fetch failed')).toBe('Сервис Атласа не отвечает');
  });

  it('keeps other specific error messages as is', () => {
    expect(formatAtlasErrorMessage('HTTP 404: Not Found')).toBe('HTTP 404: Not Found');
  });

  it('handles empty or null messages gracefully', () => {
    expect(formatAtlasErrorMessage(null)).toBeNull();
    expect(formatAtlasErrorMessage(undefined)).toBeNull();
  });
});
