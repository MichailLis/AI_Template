import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminSettingsWorkspace } from './admin-settings-workspace';

const updatePrivacyPolicy = vi.fn();

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey: () => ['privacy-policy'],
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey: () => ['profession-atlas'],
  useAdminSettingsControllerGetOpenRouterSettings: () => ({
    data: {
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'ENV',
        updatedAt: null,
        health: {
          status: 'failed',
          checkedAt: '2026-09-12T20:05:00.000Z',
          errorMessage: 'User not found.',
        },
      },
    },
  }),
  useAdminSettingsControllerGetProfessionAtlasSettings: () => ({
    data: {
      professionAtlas: {
        apiUrl: 'https://atlas.example/api-backend',
        coverage: {
          status: 'unavailable',
          checkedAt: '2026-09-12T20:05:00.000Z',
          total: 12,
          found: 0,
          missing: [],
          duplicates: [],
          items: [],
          errorMessage: 'fetch failed',
        },
        publicUrl: 'https://atlas.example',
        updatedAt: null,
        url: 'https://atlas.example',
      },
    },
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAdminSettingsControllerGetPrivacyPolicySettings: () => ({
    data: {
      privacyPolicy: {
        content: 'Политика',
        operatorFullName: 'АНО «Старый оператор»',
        publishedAt: '2026-07-10T00:00:00.000Z',
        updatedAt: null,
        version: '2026-07-10',
      },
    },
    isError: false,
    isLoading: false,
    refetch: vi.fn(),
  }),
  useAdminSettingsControllerUpdatePrivacyPolicy: () => ({
    isPending: false,
    mutate: updatePrivacyPolicy,
  }),
  useAdminSettingsControllerUpdateProfessionAtlasUrl: () => ({
    isPending: false,
    mutate: vi.fn(),
  }),
}));

const renderWorkspace = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AdminSettingsWorkspace />
    </QueryClientProvider>,
  );
};

/**
 * Находка аудита UX-02: шапка утверждала «OpenRouter готов» и «Атлас подключен» по одному наличию
 * настроек, пока ниже на той же странице атлас был «Недоступен · fetch failed».
 */
describe('AdminSettingsWorkspace integration health header', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('reports the result of the connection checks instead of mere configuration', () => {
    renderWorkspace();

    expect(screen.getByText(/^OpenRouter недоступен · /)).toBeInTheDocument();
    expect(screen.getByText(/^Атлас недоступен · /)).toBeInTheDocument();
    expect(screen.queryByText('OpenRouter готов')).not.toBeInTheDocument();
    expect(screen.queryByText('Атлас подключен')).not.toBeInTheDocument();
  });
});

describe('AdminSettingsWorkspace tabs', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const OPEN_ROUTER_CARD = 'Ключ берется только из переменной окружения сервера.';
  const ATLAS_CARD = 'Карточки, предприятия, мероприятия и учебные заведения для результата Polus.';
  const PRIVACY_CARD =
    'Глобальная публичная политика для страницы /privacy и согласия перед стартом теста.';

  it('shows only the integrations tab content by default', () => {
    renderWorkspace();

    expect(screen.getByText(OPEN_ROUTER_CARD)).toBeInTheDocument();
    expect(screen.queryByText(ATLAS_CARD)).not.toBeInTheDocument();
    expect(screen.queryByText(PRIVACY_CARD)).not.toBeInTheDocument();
  });

  it('opens one settings domain at a time', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Атлас профессий' }));

    expect(screen.getByText(ATLAS_CARD)).toBeInTheDocument();
    expect(screen.queryByText(OPEN_ROUTER_CARD)).not.toBeInTheDocument();
    expect(screen.queryByText(PRIVACY_CARD)).not.toBeInTheDocument();
  });
});

describe('AdminSettingsWorkspace privacy policy', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('submits the edited platform operator name with the policy', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Политика данных' }));

    fireEvent.change(
      screen.getByRole('textbox', { name: 'Наименование оператора персональных данных' }),
      { target: { value: '  ООО «Новый оператор»  ' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Сохранить политику' }));

    expect(updatePrivacyPolicy).toHaveBeenCalledWith({
      data: {
        content: 'Политика',
        operatorFullName: 'ООО «Новый оператор»',
        publishedAt: '2026-07-10T00:00:00.000Z',
        version: '2026-07-10',
      },
    });
  });

  /** Находка аудита UX-18: автоматическое обновление даты публикации при новой редакции. */
  it('automatically sets publication date when version is edited, and submits new publication date', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Политика данных' }));

    fireEvent.change(screen.getByRole('textbox', { name: 'Версия политики' }), {
      target: { value: '2026-09-14-v2' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Сохранить политику' }));

    expect(updatePrivacyPolicy).toHaveBeenCalled();
    const calledData = updatePrivacyPolicy.mock.calls[0][0].data;
    expect(calledData.version).toBe('2026-09-14-v2');
    expect(calledData.publishedAt).not.toBe('2026-07-10T00:00:00.000Z');
  });

  it('warns when editing version but reverting date to the previous edition date', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Политика данных' }));

    // Сначала меняем версию — дата обновляется
    fireEvent.change(screen.getByRole('textbox', { name: 'Версия политики' }), {
      target: { value: '2026-09-14-v2' },
    });

    // Возвращаем старую дату вручную (до прежней редакции от 10.07.2026)
    fireEvent.change(screen.getByLabelText('Дата публикации'), {
      target: { value: '01.07.2026 00:00' },
    });

    expect(
      screen.getByText(/редакция изменена, но дата публикации осталась прежней/i),
    ).toBeInTheDocument();

    // Нажимаем «Поставить текущую дату»
    fireEvent.click(screen.getByRole('button', { name: 'Поставить текущую дату' }));
    expect(
      screen.queryByText(/редакция изменена, но дата публикации осталась прежней/i),
    ).not.toBeInTheDocument();
  });

  /** Находка аудита PR #55 (ait-hw7): невалидная/неполная дата в драфте блокирует submit. */
  it('disables submit and prevents mutation when publication date has an incomplete or invalid draft', () => {
    renderWorkspace();

    fireEvent.click(screen.getByRole('tab', { name: 'Политика данных' }));

    const dateInput = screen.getByLabelText('Дата публикации');
    const submitButton = screen.getByRole('button', { name: 'Сохранить политику' });

    expect(submitButton).not.toBeDisabled();

    // Вводим невалидную дату (31 февраля)
    fireEvent.change(dateInput, { target: { value: '31.02.2026 12:00' } });

    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(updatePrivacyPolicy).not.toHaveBeenCalled();

    // Вводим неполную дату
    fireEvent.change(dateInput, { target: { value: '10.07.2026 03:0' } });

    expect(submitButton).toBeDisabled();

    fireEvent.click(submitButton);
    expect(updatePrivacyPolicy).not.toHaveBeenCalled();

    // Нажимаем «Поставить текущую дату» — кнопка снова активна
    fireEvent.click(screen.getByRole('button', { name: 'Поставить текущую дату' }));
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);
    expect(updatePrivacyPolicy).toHaveBeenCalled();
  });
});
