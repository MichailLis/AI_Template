import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminUsersTable } from './admin-users-table';

import type { AdminUser } from './admin-users-workspace.types';

const createUser = (overrides: Partial<AdminUser> = {}): AdminUser => ({
  id: 562,
  email: 'live-check-562@example.com',
  name: 'Ирина Петрова',
  role: 'USER',
  deactivatedAt: null,
  lastLoginAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides,
});

const renderTable = (users: AdminUser[]) =>
  render(
    <AdminUsersTable
      users={users}
      currentUserId={1}
      pendingUserId={null}
      activeActionsUserId={null}
      onToggleActionsMenu={vi.fn()}
      onCloseActionsMenu={vi.fn()}
      onEditUser={vi.fn()}
      onToggleRole={vi.fn()}
      onResetPassword={vi.fn()}
      onRevokeSessions={vi.fn()}
      onToggleStatus={vi.fn()}
      onCopyEmail={vi.fn()}
      formatDateTime={(value) => value}
      getRoleBadgeClass={() => ''}
      getRoleLabel={(role) => (role === 'ADMIN' ? 'Администратор' : 'Пользователь')}
      sortBy="createdAt"
      sortOrder="desc"
      onSortByChange={vi.fn()}
    />,
  );

const getUserRow = (email: string) => {
  const row = screen.getByText(email).closest('tr');
  if (!row) {
    throw new Error(`row for ${email} not found`);
  }
  return row;
};

/**
 * Находка аудита UX-10: первой строкой шел email, затем «ID: N», имя третьим и мелко. На ширине
 * 390px колонка статуса скрыта, поэтому отключенный аккаунт не отличался от активного.
 */
describe('AdminUsersTable', () => {
  afterEach(cleanup);

  it('leads with the name, keeps the email secondary and drops the id line', () => {
    renderTable([createUser()]);

    const userCell = within(getUserRow('live-check-562@example.com')).getAllByRole('cell')[0];
    const lines = [...userCell.querySelectorAll('p')].map((line) => line.textContent);

    expect(lines).toEqual(['Ирина Петрова', 'live-check-562@example.com']);
    expect(screen.queryByText(/ID: 562/)).not.toBeInTheDocument();
  });

  it('uses the email as the only line when the user has no name', () => {
    renderTable([createUser({ name: null })]);

    const userCell = within(getUserRow('live-check-562@example.com')).getAllByRole('cell')[0];

    expect([...userCell.querySelectorAll('p')].map((line) => line.textContent)).toEqual([
      'live-check-562@example.com',
    ]);
  });

  it('shows the status next to the role for screens where the status column is hidden', () => {
    renderTable([createUser({ deactivatedAt: '2026-09-10T00:00:00.000Z' })]);

    const roleCell = within(getUserRow('live-check-562@example.com')).getAllByRole('cell')[1];
    const mobileStatus = within(roleCell).getByText('Отключён');

    expect(mobileStatus.closest('.md\\:hidden')).not.toBeNull();
  });
});
