import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminUserActionsMenu } from './admin-user-actions-menu';

const onToggleOpen = vi.fn();
const onEdit = vi.fn();
const onToggleRole = vi.fn();
const onResetPassword = vi.fn();
const onRevokeSessions = vi.fn();
const onToggleStatus = vi.fn();
const onCopyEmail = vi.fn();
const onClose = vi.fn();

const CURRENT_ADMIN_ID = 1;

const renderMenu = (
  user: { id: number; email: string; role: 'USER' | 'ADMIN'; deactivatedAt?: string | null },
  overrides: { pendingUserId?: number | null; isOpen?: boolean } = {},
) =>
  render(
    <AdminUserActionsMenu
      user={{ deactivatedAt: null, ...user }}
      currentUserId={CURRENT_ADMIN_ID}
      pendingUserId={overrides.pendingUserId ?? null}
      isOpen={overrides.isOpen ?? true}
      onToggleOpen={onToggleOpen}
      onEdit={onEdit}
      onToggleRole={onToggleRole}
      onResetPassword={onResetPassword}
      onRevokeSessions={onRevokeSessions}
      onToggleStatus={onToggleStatus}
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

  it('does not offer an admin actions that would lock themselves out', () => {
    renderMenu({ id: CURRENT_ADMIN_ID, email: 'me@example.com', role: 'ADMIN' });

    expect(screen.getByRole('button', { name: /сбросить пароль/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /завершить сеансы/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /отключить доступ/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /изменить данные/i })).toBeEnabled();
  });

  /**
   * Находка аудита UX-12: для своей учетки четыре пункта были просто серыми, без объяснения, и
   * администратор не понимал, сломано ли меню или действие запрещено.
   */
  it('explains why actions are unavailable for the own account', () => {
    renderMenu({ id: CURRENT_ADMIN_ID, email: 'me@example.com', role: 'ADMIN' });

    expect(screen.getByText(/Нельзя применить к своей учетке/)).toBeInTheDocument();

    for (const name of [
      /снять права администратора/i,
      /сбросить пароль/i,
      /завершить сеансы/i,
      /отключить доступ/i,
    ]) {
      expect(screen.getByRole('button', { name })).toHaveAccessibleDescription(
        /Нельзя применить к своей учетке/,
      );
    }
    expect(
      screen.getByRole('button', { name: /изменить данные/i }),
    ).not.toHaveAccessibleDescription();
  });

  it('shows no own-account explanation for another user', () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' });

    expect(screen.queryByText(/Нельзя применить к своей учетке/)).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /сбросить пароль/i }),
    ).not.toHaveAccessibleDescription();
  });

  it('routes each management action to its handler and closes the menu', async () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' });

    await userEvent.click(screen.getByRole('button', { name: /изменить данные/i }));
    await userEvent.click(screen.getByRole('button', { name: /сбросить пароль/i }));
    await userEvent.click(screen.getByRole('button', { name: /завершить сеансы/i }));
    await userEvent.click(screen.getByRole('button', { name: /отключить доступ/i }));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onResetPassword).toHaveBeenCalledTimes(1);
    expect(onRevokeSessions).toHaveBeenCalledTimes(1);
    expect(onToggleStatus).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(4);
  });

  it('offers to switch access back on for a deactivated user', () => {
    renderMenu({
      id: 3,
      email: 'member@example.com',
      role: 'USER',
      deactivatedAt: '2026-09-01T00:00:00.000Z',
    });

    expect(screen.getByRole('button', { name: /включить доступ/i })).toBeEnabled();
    expect(screen.queryByRole('button', { name: /отключить доступ/i })).not.toBeInTheDocument();
  });

  it('renders no actions until the menu is opened', () => {
    renderMenu({ id: 3, email: 'member@example.com', role: 'USER' }, { isOpen: false });

    expect(screen.queryByRole('button', { name: /администратор/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Действия для member@example.com' })).toBeEnabled();
  });
});
