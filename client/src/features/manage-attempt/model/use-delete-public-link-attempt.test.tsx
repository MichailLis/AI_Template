import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDeletePublicLinkAttempt } from './use-delete-public-link-attempt';

import type { ReactNode } from 'react';

const { mutateMock, toastErrorMock, toastSuccessMock } = vi.hoisted(() => ({
  mutateMock: vi.fn(),
  toastErrorMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

// Только мутация подменяется: ключи запросов остаются настоящими, их и проверяем.
vi.mock('@/shared/api/generated/tests/tests', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();

  return {
    ...actual,
    useTestsAdminAttemptsControllerDeletePublicLinkAttempt: () => ({
      mutate: mutateMock,
      isPending: false,
    }),
  };
});

vi.mock('sonner', () => ({
  toast: { success: toastSuccessMock, error: toastErrorMock },
}));

const renderDeleteHook = () => {
  const queryClient = new QueryClient();
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
  const removeSpy = vi.spyOn(queryClient, 'removeQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useDeletePublicLinkAttempt(13, 7), { wrapper });

  return { result, invalidateSpy, removeSpy };
};

describe('useDeletePublicLinkAttempt', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes the attempt list, the link journal and the topic analytics after a delete', () => {
    mutateMock.mockImplementation((_variables: unknown, options: { onSuccess: () => void }) =>
      options.onSuccess(),
    );
    const { result, invalidateSpy, removeSpy } = renderDeleteHook();
    const onDeleted = vi.fn();

    act(() => result.current.deleteAttempt(33, onDeleted));

    expect(mutateMock).toHaveBeenCalledWith({ linkId: 13, attemptId: 33 }, expect.any(Object));
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(toastSuccessMock).toHaveBeenCalledWith('Попытка удалена');
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['/admin/tests/attempts/33'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/admin/tests/public-links/13/attempts'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/admin/tests/public-links/13/history'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['/admin/tests/topics/7/analytics/summary'],
    });
  });

  it('keeps the card open and shows the error when the server refuses the delete', () => {
    mutateMock.mockImplementation(
      (_variables: unknown, options: { onError: (error: unknown) => void }) =>
        options.onError(new Error('Attempt not found')),
    );
    const { result, invalidateSpy } = renderDeleteHook();
    const onDeleted = vi.fn();

    act(() => result.current.deleteAttempt(33, onDeleted));

    expect(onDeleted).not.toHaveBeenCalled();
    expect(toastErrorMock).toHaveBeenCalledTimes(1);
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
