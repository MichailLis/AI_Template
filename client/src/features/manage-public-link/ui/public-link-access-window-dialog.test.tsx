import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkAccessWindowDialog } from './public-link-access-window-dialog';

import type { PublicLinkAccessWindowTarget } from './public-link-access-window-dialog';

const updateMutate = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  getTestsAdminPublicLinksControllerListPublicLinksQueryKey: () => ['public-links'],
  getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey: () => ['archived-links'],
  useTestsAdminPublicLinksControllerUpdatePublicLink: () => ({
    mutate: updateMutate,
    isPending: false,
  }),
}));

const renderDialog = (link: PublicLinkAccessWindowTarget | null, onClose = vi.fn()) => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <PublicLinkAccessWindowDialog link={link} onClose={onClose} />
    </QueryClientProvider>,
  );
  return { onClose };
};

describe('PublicLinkAccessWindowDialog', () => {
  afterEach(() => {
    cleanup();
    updateMutate.mockReset();
  });

  it('clears the closing time and keeps the opening time the link already has', async () => {
    const user = userEvent.setup();
    const link = {
      id: 42,
      shortCode: 'WINDOW26',
      startsAt: '2026-11-12T07:00:00.000Z',
      endsAt: '2026-11-12T07:45:00.000Z',
    };
    renderDialog(link);

    await user.clear(screen.getByLabelText('Закрыть в'));
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(updateMutate).toHaveBeenCalledWith(
      { linkId: 42, data: { startsAt: link.startsAt, endsAt: null } },
      expect.any(Object),
    );
  });

  it('does not save a window that closes before it opens', async () => {
    const user = userEvent.setup();
    renderDialog({ id: 43, shortCode: 'INVERTED', startsAt: null, endsAt: null });

    await user.type(screen.getByLabelText('Открыть с'), '121120261000');
    await user.type(screen.getByLabelText('Закрыть в'), '121120260900');

    expect(screen.getByRole('button', { name: 'Сохранить' })).toBeDisabled();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  it('closes after the window is saved', async () => {
    const user = userEvent.setup();
    updateMutate.mockImplementation((_variables: unknown, options: { onSuccess: () => void }) =>
      options.onSuccess(),
    );
    const { onClose } = renderDialog({
      id: 44,
      shortCode: 'SAVED',
      startsAt: null,
      endsAt: null,
    });

    await user.type(screen.getByLabelText('Закрыть в'), '121120261045');
    await user.click(screen.getByRole('button', { name: 'Сохранить' }));

    expect(updateMutate).toHaveBeenCalledWith(
      {
        linkId: 44,
        data: { startsAt: null, endsAt: new Date('2026-11-12T10:45').toISOString() },
      },
      expect.any(Object),
    );
    expect(onClose).toHaveBeenCalled();
  });
});
