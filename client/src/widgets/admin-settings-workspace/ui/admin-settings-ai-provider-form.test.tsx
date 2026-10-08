import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AiProviderForm } from './admin-settings-ai-provider-form';

import type { AiProviderSettings } from './admin-settings-cards.model';

const mutate = vi.fn();

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getAdminSettingsControllerGetAiProviderSettingsQueryKey: () => ['ai-provider'],
  useAdminSettingsControllerUpdateAiProviderSettings: () => ({ mutate, isPending: false }),
}));

const settings: AiProviderSettings = {
  provider: 'polza',
  label: 'Polza.ai',
  baseUrl: 'https://polza.ai/api/v1',
  defaultModel: null,
  isConfigured: true,
  maskedValue: 'pza-supe...-key',
  source: 'ENV',
  updatedAt: null,
  health: { status: 'ok', checkedAt: '2026-09-12T20:05:00.000Z' },
};

const renderForm = (overrides: Partial<AiProviderSettings> = {}) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AiProviderForm aiProvider={{ ...settings, ...overrides }} />
    </QueryClientProvider>,
  );

describe('AiProviderForm', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('does not send an API key when the field is left empty', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить настройки' }));

    expect(mutate).toHaveBeenCalledWith({
      data: { provider: 'polza', baseUrl: 'https://polza.ai/api/v1', defaultModel: null },
    });
  });

  it('sends the switched provider, base URL, key and model', () => {
    renderForm();

    fireEvent.change(screen.getByLabelText('Провайдер'), {
      target: { value: 'openai-compatible' },
    });
    fireEvent.change(screen.getByLabelText('Адрес API (base URL)'), {
      target: { value: 'https://llm.example.com/v1' },
    });
    fireEvent.change(screen.getByLabelText('Ключ API'), { target: { value: ' new-key ' } });
    fireEvent.change(screen.getByLabelText('Модель по умолчанию'), {
      target: { value: 'gpt-4o-mini' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить настройки' }));

    expect(mutate).toHaveBeenCalledWith({
      data: {
        provider: 'openai-compatible',
        baseUrl: 'https://llm.example.com/v1',
        defaultModel: 'gpt-4o-mini',
        apiKey: 'new-key',
      },
    });
  });

  it('blocks saving a generic provider without a base URL', () => {
    renderForm({ provider: 'openai-compatible', baseUrl: null });

    expect(screen.getByRole('button', { name: 'Сохранить настройки' })).toBeDisabled();
  });

  it('offers to drop a saved key only when it is stored in the panel', () => {
    renderForm({ source: 'DB' });

    fireEvent.click(screen.getByLabelText(/Удалить сохранённый ключ/));
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить настройки' }));

    expect(mutate).toHaveBeenCalledWith({
      data: {
        provider: 'polza',
        baseUrl: 'https://polza.ai/api/v1',
        defaultModel: null,
        clearApiKey: true,
      },
    });
  });
});
