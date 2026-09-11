import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminUserEditorSheet } from './admin-user-editor-sheet';

import type { AdminUser } from './admin-users-workspace.types';

vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const user: AdminUser = {
  id: 5,
  email: 'member@example.com',
  name: 'Member',
  role: 'USER',
  deactivatedAt: null,
  lastLoginAt: null,
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
};

const validationError = (path: string, message: string) => ({
  response: {
    status: 400,
    data: {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: [{ path, message }],
      },
    },
  },
});

describe('AdminUserEditorSheet', () => {
  afterEach(cleanup);

  it('creates a user without a password so the server generates one', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(<AdminUserEditorSheet mode="create" onClose={onClose} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Email *'), ' new@example.com ');
    await userEvent.click(screen.getByRole('button', { name: 'Создать пользователя' }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'new@example.com', role: 'USER' });
    expect(onClose).toHaveBeenCalled();
  });

  it('shows a server validation error under its field and keeps the sheet open', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        validationError('password', 'Password must be at least 8 characters long'),
      );
    const onClose = vi.fn();

    render(<AdminUserEditorSheet mode="create" onClose={onClose} onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText('Email *'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Пароль'), 'short');
    await userEvent.click(screen.getByRole('button', { name: 'Создать пользователя' }));

    expect(
      await screen.findByText('Пароль должен содержать минимум 8 символов'),
    ).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('edits only email and name, and clears an emptied name', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AdminUserEditorSheet mode="edit" user={user} onClose={vi.fn()} onSubmit={onSubmit} />);

    expect(screen.getByLabelText('Email *')).toHaveValue('member@example.com');
    expect(screen.queryByLabelText('Пароль')).not.toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Имя'));
    await userEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' }));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'member@example.com', name: null });
  });
});
