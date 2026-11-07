import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePublicLinkActions } from './use-public-link-actions';

import type { ReactNode } from 'react';

const deleteMutate = vi.fn();
const restoreMutate = vi.fn();

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  getTestsAdminPublicLinksControllerListPublicLinksQueryKey: () => ['public-links'],
  getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey: () => ['archived-links'],
  useTestsAdminPublicLinksControllerDeletePublicLink: () => ({
    mutate: deleteMutate,
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerRestorePublicLink: () => ({
    mutate: restoreMutate,
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerUpdatePublicLink: () => ({ mutate: vi.fn(), isPending: false }),
  useTestsAdminPublicLinksControllerMoveToActivePublishedVersion: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

const renderActions = () => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const { result } = renderHook(() => usePublicLinkActions(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { result, invalidateQueries };
};

describe('usePublicLinkActions', () => {
  it('archives a link, reports it to the caller and refreshes both lists', () => {
    deleteMutate.mockImplementation((_variables: unknown, options: { onSuccess: () => void }) =>
      options.onSuccess(),
    );
    const onDone = vi.fn();
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.archivePublicLink(5, onDone));

    expect(deleteMutate).toHaveBeenCalledWith({ linkId: 5 }, expect.any(Object));
    expect(onDone).toHaveBeenCalledOnce();
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['public-links'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['archived-links'] });
  });

  it('hands the restored link to the caller and refreshes both lists', () => {
    restoreMutate.mockImplementation(
      (_variables: unknown, options: { onSuccess: (link: { id: number }) => void }) =>
        options.onSuccess({ id: 9 }),
    );
    const onDone = vi.fn();
    const { result, invalidateQueries } = renderActions();

    act(() => result.current.restorePublicLink(9, onDone));

    expect(onDone).toHaveBeenCalledWith({ id: 9 });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['archived-links'] });
  });
});
