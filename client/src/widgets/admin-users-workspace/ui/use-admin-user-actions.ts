import { useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerCreateUser,
  useAdminControllerResetUserPassword,
  useAdminControllerRevokeUserSessions,
  useAdminControllerUpdateUser,
  useAdminControllerUpdateUserRole,
  useAdminControllerUpdateUserStatus,
} from '@/shared/api/generated/admin/admin';

import { getApiErrorMessage } from './admin-users-workspace.utils';

import type { AdminUser, IssuedCredentials, UserRole } from './admin-users-workspace.types';
import type { CreateUserDto, UpdateUserDto } from '@/shared/api/model';

export type UserEditorState = 'closed' | { mode: 'create' } | { mode: 'edit'; user: AdminUser };
export type UserConfirmationKind = 'reset-password' | 'revoke-sessions' | 'deactivate';
export type UserConfirmation = { kind: UserConfirmationKind; user: AdminUser } | null;

const ROLE_LABEL_BY_CODE: Record<UserRole, string> = {
  USER: 'Пользователь',
  ADMIN: 'Администратор',
};

interface UseAdminUserActionsOptions {
  /** Перечитывает список после изменения: сортировку и фильтры решает сервер. */
  onUsersChanged: () => Promise<unknown>;
}

export function useAdminUserActions({ onUsersChanged }: UseAdminUserActionsOptions) {
  const [editorState, setEditorState] = useState<UserEditorState>('closed');
  const [confirmation, setConfirmation] = useState<UserConfirmation>(null);
  const [credentials, setCredentials] = useState<IssuedCredentials | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);

  const createUserMutation = useAdminControllerCreateUser();
  const updateUserMutation = useAdminControllerUpdateUser();
  const updateRoleMutation = useAdminControllerUpdateUserRole();
  const updateStatusMutation = useAdminControllerUpdateUserStatus();
  const resetPasswordMutation = useAdminControllerResetUserPassword();
  const revokeSessionsMutation = useAdminControllerRevokeUserSessions();

  // Ошибки создания и редактирования не ловятся здесь: их показывает форма, в том числе по полям.
  const createUser = async (payload: CreateUserDto) => {
    const result = await createUserMutation.mutateAsync({ data: payload });
    toast.success('Пользователь создан');

    if (result.generatedPassword) {
      setCredentials({
        email: result.user.email,
        password: result.generatedPassword,
        reason: 'created',
      });
    }

    await onUsersChanged();
  };

  const updateUser = async (userId: number, payload: UpdateUserDto) => {
    await updateUserMutation.mutateAsync({ id: userId, data: payload });
    toast.success('Данные пользователя сохранены');
    await onUsersChanged();
  };

  const runUserAction = async (userId: number, action: () => Promise<void>) => {
    setPendingUserId(userId);

    try {
      await action();
      await onUsersChanged();
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error));
    } finally {
      setPendingUserId(null);
      setConfirmation(null);
    }
  };

  const resetPassword = async (user: AdminUser) => {
    const result = await resetPasswordMutation.mutateAsync({ id: user.id, data: {} });

    if (result.generatedPassword) {
      setCredentials({
        email: result.user.email,
        password: result.generatedPassword,
        reason: 'reset',
      });
    }

    toast.success('Пароль сброшен, сеансы пользователя завершены');
  };

  const confirmAction = () => {
    if (!confirmation) {
      return;
    }

    const { kind, user } = confirmation;

    void runUserAction(user.id, async () => {
      if (kind === 'reset-password') {
        await resetPassword(user);
        return;
      }

      if (kind === 'revoke-sessions') {
        await revokeSessionsMutation.mutateAsync({ id: user.id });
        toast.success('Сеансы пользователя завершены');
        return;
      }

      await updateStatusMutation.mutateAsync({ id: user.id, data: { status: 'DEACTIVATED' } });
      toast.success('Доступ пользователя отключён');
    });
  };

  // Отключение подтверждается, а включение нет: вернуть доступ безопасно и легко отменить.
  const toggleUserStatus = (user: AdminUser) => {
    if (user.deactivatedAt === null) {
      setConfirmation({ kind: 'deactivate', user });
      return;
    }

    void runUserAction(user.id, async () => {
      await updateStatusMutation.mutateAsync({ id: user.id, data: { status: 'ACTIVE' } });
      toast.success('Доступ пользователя снова включён');
    });
  };

  const toggleUserRole = (userId: number, nextRole: UserRole) => {
    void runUserAction(userId, async () => {
      await updateRoleMutation.mutateAsync({ id: userId, data: { role: nextRole } });
      toast.success(`Роль обновлена: ${ROLE_LABEL_BY_CODE[nextRole]}`);
    });
  };

  return {
    editorState,
    confirmation,
    credentials,
    pendingUserId,
    isConfirming: confirmation !== null && pendingUserId === confirmation.user.id,
    openCreateEditor: () => setEditorState({ mode: 'create' }),
    openEditEditor: (user: AdminUser) => setEditorState({ mode: 'edit', user }),
    closeEditor: () => setEditorState('closed'),
    requestPasswordReset: (user: AdminUser) => setConfirmation({ kind: 'reset-password', user }),
    requestSessionRevoke: (user: AdminUser) => setConfirmation({ kind: 'revoke-sessions', user }),
    closeConfirmation: () => {
      if (pendingUserId === null) {
        setConfirmation(null);
      }
    },
    closeCredentials: () => setCredentials(null),
    confirmAction,
    toggleUserStatus,
    toggleUserRole,
    createUser,
    updateUser,
  };
}
