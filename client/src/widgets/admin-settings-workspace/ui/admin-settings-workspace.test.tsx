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

describe('AdminSettingsWorkspace privacy policy', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('submits the edited platform operator name with the policy', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AdminSettingsWorkspace />
      </QueryClientProvider>,
    );

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
