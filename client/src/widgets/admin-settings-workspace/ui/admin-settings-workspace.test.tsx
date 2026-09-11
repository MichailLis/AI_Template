import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminSettingsWorkspace } from './admin-settings-workspace';

const updatePrivacyPolicy = vi.fn();

vi.mock('@/shared/api/generated/admin/admin', () => ({
  getAdminSettingsControllerGetPrivacyPolicySettingsQueryKey: () => ['privacy-policy'],
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey: () => ['profession-atlas'],
  useAdminSettingsControllerGetOpenRouterSettings: () => ({
    data: { openRouter: { configured: true, source: 'ENV' } },
  }),
  useAdminSettingsControllerGetProfessionAtlasSettings: () => ({
    data: {
      professionAtlas: {
        apiUrl: 'https://atlas.example/api-backend',
        coverage: null,
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
});
