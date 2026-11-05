import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRestartAnalysis } from './use-restart-analysis';

import type { ReactNode } from 'react';

interface MutationOptions<TData> {
  mutation: { onSuccess: (data: TData) => Promise<void>; onError: (error: unknown) => void };
}

const hoisted = vi.hoisted(() => ({
  attemptMutate: vi.fn(),
  failedMutate: vi.fn(),
  attemptOptions: { current: undefined as unknown },
  failedOptions: { current: undefined as unknown },
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() } }));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryKey: (linkId: number) => [
    `/admin/tests/public-links/${linkId}/attempts`,
  ],
  getTestsAdminAttemptsControllerGetAttemptDetailQueryKey: (attemptId: number) => [
    `/admin/tests/attempts/${attemptId}`,
  ],
  useTestsAdminAttemptsControllerRestartAttemptAnalysis: (options: unknown) => {
    hoisted.attemptOptions.current = options;
    return { mutate: hoisted.attemptMutate, isPending: false };
  },
  useTestsAdminAttemptsControllerRestartFailedAnalyses: (options: unknown) => {
    hoisted.failedOptions.current = options;
    return { mutate: hoisted.failedMutate, isPending: true };
  },
}));

const renderRestart = (publicLinkId: number | null = 13) => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const view = renderHook(() => useRestartAnalysis(publicLinkId), { wrapper });

  return { ...view, invalidateQueries };
};

const attemptOptions = () =>
  hoisted.attemptOptions.current as MutationOptions<{ attemptId: number; restarted: boolean }>;
const failedOptions = () => hoisted.failedOptions.current as MutationOptions<{ restarted: number }>;

describe('useRestartAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends the restart of one attempt', () => {
    const { result } = renderRestart();

    result.current.restartAttemptAnalysis(191);

    expect(hoisted.attemptMutate).toHaveBeenCalledWith({ attemptId: 191 });
  });

  it('restarts the failed analyses of the open link only', () => {
    const { result } = renderRestart(13);

    result.current.restartFailedAnalyses();

    expect(hoisted.failedMutate).toHaveBeenCalledWith({ linkId: 13 });
  });

  it('sends nothing for the bulk restart when no link is open', () => {
    const { result } = renderRestart(null);

    result.current.restartFailedAnalyses();

    expect(hoisted.failedMutate).not.toHaveBeenCalled();
  });

  it('reports the pending state of both actions so a button can lock itself', () => {
    const { result } = renderRestart();

    expect(result.current.isRestartingAttempt).toBe(false);
    expect(result.current.isRestartingFailed).toBe(true);
  });

  it('refreshes the table and the card of the attempt after a restart', async () => {
    const { invalidateQueries } = renderRestart(13);

    await attemptOptions().mutation.onSuccess({ attemptId: 191, restarted: true });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/tests/public-links/13/attempts'],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/admin/tests/attempts/191'] });
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Анализ перезапущен'));
  });

  it('says so, instead of claiming a restart, when the server had nothing to restart', async () => {
    renderRestart();

    await attemptOptions().mutation.onSuccess({ attemptId: 191, restarted: false });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Перезапуск не нужен: анализ уже идёт или готов');
  });

  it('refreshes the table after the bulk restart and says how many analyses started', async () => {
    const { invalidateQueries } = renderRestart(13);

    await failedOptions().mutation.onSuccess({ restarted: 7 });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['/admin/tests/public-links/13/attempts'],
    });
    expect(toast.success).toHaveBeenCalledWith('Перезапущено анализов: 7');
  });

  it('reports an empty bulk restart as such', async () => {
    renderRestart();

    await failedOptions().mutation.onSuccess({ restarted: 0 });

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.info).toHaveBeenCalledWith('Неудачных анализов не осталось');
  });

  it('shows a request error instead of staying silent', () => {
    renderRestart();

    attemptOptions().mutation.onError(new Error('network'));
    failedOptions().mutation.onError(new Error('network'));

    expect(toast.error).toHaveBeenCalledTimes(2);
  });
});
