import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePrivacyPolicyControllerGetPrivacyPolicy } from '@/shared/api/generated/privacy-policy/privacy-policy';

import PrivacyPage from './privacy-page';

vi.mock('@/shared/api/generated/privacy-policy/privacy-policy', () => ({
  usePrivacyPolicyControllerGetPrivacyPolicy: vi.fn(),
}));

describe('PrivacyPage', () => {
  it('renders current privacy policy content', () => {
    vi.mocked(usePrivacyPolicyControllerGetPrivacyPolicy).mockReturnValue({
      data: {
        privacyPolicy: {
          version: '2026-07-09',
          publishedAt: '2026-07-09T00:00:00.000Z',
          content: 'ПОЛИТИКА\n\n1. ОБЩИЕ ПОЛОЖЕНИЯ\n\nТекст политики.',
          updatedAt: null,
        },
      },
      isError: false,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof usePrivacyPolicyControllerGetPrivacyPolicy>);

    render(<PrivacyPage />);

    expect(
      screen.getByRole('heading', { name: 'Политика обработки персональных данных' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/версия: 2026-07-09/i)).toBeInTheDocument();
    expect(screen.getByText('1. ОБЩИЕ ПОЛОЖЕНИЯ')).toBeInTheDocument();
    expect(screen.getByText('Текст политики.')).toBeInTheDocument();
  });

  it('renders retry action when policy loading fails', () => {
    const refetch = vi.fn();
    vi.mocked(usePrivacyPolicyControllerGetPrivacyPolicy).mockReturnValue({
      data: undefined,
      isError: true,
      isLoading: false,
      refetch,
    } as unknown as ReturnType<typeof usePrivacyPolicyControllerGetPrivacyPolicy>);

    render(<PrivacyPage />);

    fireEvent.click(screen.getByRole('button', { name: /повторить/i }));

    expect(screen.getByText(/политика временно недоступна/i)).toBeInTheDocument();
    expect(refetch).toHaveBeenCalledWith();
  });
});
