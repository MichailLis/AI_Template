import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUserActionsMenu } from './admin-user-actions-menu';

const onToggleOpen = vi.fn();
const onToggleRole = vi.fn();
const onCopyEmail = vi.fn();
const onClose = vi.fn();

const CURRENT_ADMIN_ID = 1;

const renderMenu = (
  user: { id: number; email: string; role: 'USER' | 'ADMIN' },
  overrides: { pendingUserId?: number | null; isOpen?: boolean } = {},
) =>
  render(
    <AdminUserActionsMenu
      user={user}
      currentUserId={CURRENT_ADMIN_ID}
      pendingUserId={overrides.pendingUserId ?? null}
      isOpen={overrides.isOpen ?? true}
      onToggleOpen={onToggleOpen}
      onToggleRole={onToggleRole}
      onCopyEmail={onCopyEmail}
      onClose={onClose}
    />,
  );

const roleToggle = () => screen.getByRole('button', { name: /администратор/i });

describe('AdminUserActionsMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    onCopyEmail.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it('blocks an admin from removing their own admin rights', () => {
    // The server rejects self-demotion; the UI must not offer it either, or the
    // operator can lock themselves out of the only account that can grant it back.
    renderMenu({ id: CURRENT_ADMIN_ID, email: 'me@example.com', role: 'ADMIN' });

    expect(roleToggle()).toBeDisabled();
  });

  it('allows demoting a different admin', async () => {
    renderMenu({ id: 2, email: 'peer@example.com', role: 'ADMIN' });

    await userEvent.click(roleToggle());

    expect(onToggleRole).toHaveBeenCalledWith(2, 'USER');
  });

  it('promotes a plain user to admin', async () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' });

    await userEvent.click(roleToggle());

    expect(onToggleRole).toHaveBeenCalledWith(3, 'ADMIN');
  });

  it('disables the role toggle while that user has a request in flight', () => {
    renderMenu({ id: 2, email: 'peer@example.com', role: 'ADMIN' }, { pendingUserId: 2 });

    expect(screen.getByRole('button', { name: 'Обновление…' })).toBeDisabled();
  });

  it('leaves other rows interactive while one request is in flight', () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' }, { pendingUserId: 2 });

    expect(roleToggle()).toBeEnabled();
  });

  it('copies the email and closes the menu', async () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' });

    await userEvent.click(screen.getByRole('button', { name: /скопировать email/i }));

    expect(onCopyEmail).toHaveBeenCalledWith('member@example.com');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders no actions until the menu is opened', () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' }, { isOpen: false });

    expect(screen.queryByRole('button', { name: /администратор/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия для member@example.com' })).toBeEnabled();
  });
});
