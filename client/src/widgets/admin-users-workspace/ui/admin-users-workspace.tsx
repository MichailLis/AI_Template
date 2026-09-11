import { adminClassNames, getAdminRoleBadgeClassName } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

import { AdminUserCredentialsDialog } from './admin-user-credentials-dialog';
import { AdminUserEditorSheet } from './admin-user-editor-sheet';
import { AdminUsersFilters } from './admin-users-filters';
import { AdminUsersTable } from './admin-users-table';
import { formatDateTime } from './admin-users-workspace.utils';
import { useAdminUserActions, type UserConfirmationKind } from './use-admin-user-actions';
import { useAdminUsersWorkspace } from './use-admin-users-workspace';

const roleLabel = (role: string) => {
  if (role === 'ADMIN') {
    return 'Администратор';
  }

  return 'Пользователь';
};

const CONFIRMATION_COPY: Record<
  UserConfirmationKind,
  {
    title: string;
    confirmLabel: string;
    variant: 'default' | 'destructive';
    describe: (email: string) => string;
  }
> = {
  'reset-password': {
    title: 'Сбросить пароль?',
    confirmLabel: 'Сбросить пароль',
    variant: 'default',
    describe: (email) =>
      `Для ${email} будет создан новый пароль. Текущий перестанет работать, а сеансы пользователя завершатся.`,
  },
  'revoke-sessions': {
    title: 'Завершить сеансы?',
    confirmLabel: 'Завершить сеансы',
    variant: 'default',
    describe: (email) =>
      `${email} выйдет на всех устройствах в течение 15 минут и должен будет войти заново.`,
  },
  deactivate: {
    title: 'Отключить доступ?',
    confirmLabel: 'Отключить',
    variant: 'destructive',
    describe: (email) =>
      `${email} не сможет войти, пока доступ не включат снова. Данные пользователя сохранятся.`,
  },
};

function AdminUserActionDialogs({ actions }: { actions: ReturnType<typeof useAdminUserActions> }) {
  const { editorState, confirmation } = actions;
  const confirmationCopy = confirmation ? CONFIRMATION_COPY[confirmation.kind] : null;

  return (
    <>
      {editorState !== 'closed' && editorState.mode === 'create' ? (
        <AdminUserEditorSheet
          mode="create"
          onClose={actions.closeEditor}
          onSubmit={actions.createUser}
        />
      ) : null}
      {editorState !== 'closed' && editorState.mode === 'edit' ? (
        <AdminUserEditorSheet
          key={editorState.user.id}
          mode="edit"
          user={editorState.user}
          onClose={actions.closeEditor}
          onSubmit={(payload) => actions.updateUser(editorState.user.id, payload)}
        />
      ) : null}

      <ConfirmActionDialog
        open={confirmation !== null}
        title={confirmationCopy?.title ?? ''}
        description={
          confirmation && confirmationCopy ? confirmationCopy.describe(confirmation.user.email) : ''
        }
        confirmLabel={confirmationCopy?.confirmLabel ?? ''}
        variant={confirmationCopy?.variant}
        isConfirming={actions.isConfirming}
        onConfirm={actions.confirmAction}
        onClose={actions.closeConfirmation}
      />

      <AdminUserCredentialsDialog
        credentials={actions.credentials}
        onClose={actions.closeCredentials}
      />
    </>
  );
}

export function AdminUsersWorkspace() {
  const {
    currentUserId,
    searchInput,
    roleFilter,
    statusFilter,
    sortBy,
    sortOrder,
    activeActionsUserId,
    usersQuery,
    handleSearchInputChange,
    handleSearchSubmit,
    handleRoleFilterChange,
    handleStatusFilterChange,
    handleResetFilters,
    handleSortByChange,
    handleSortOrderToggle,
    handleToggleActionsMenu,
    handleCloseActionsMenu,
    handleCopyEmail,
    handlePreviousPage,
    handleNextPage,
  } = useAdminUsersWorkspace();
  const actions = useAdminUserActions({ onUsersChanged: () => usersQuery.refetch() });

  if (usersQuery.isLoading) {
    return (
      <Card className={adminClassNames.panel.card}>
        <CardContent className="p-4">
          <AdminStateBlock>Загрузка пользователей… Пожалуйста, подождите.</AdminStateBlock>
        </CardContent>
      </Card>
    );
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <Card className={adminClassNames.panel.errorCard}>
        <CardContent className="p-4">
          <AdminStateBlock
            tone="danger"
            action={
              <Button type="button" variant="outline" onClick={() => void usersQuery.refetch()}>
                Повторить
              </Button>
            }
          >
            Не удалось загрузить пользователей. Проверьте подключение и повторите попытку.
          </AdminStateBlock>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={adminClassNames.panel.card}>
        <CardContent className="flex flex-col gap-4 p-4">
          <AdminUsersFilters
            searchInput={searchInput}
            roleFilter={roleFilter}
            statusFilter={statusFilter}
            total={usersQuery.data.total}
            isFetching={usersQuery.isFetching}
            hasActiveFilters={
              roleFilter !== 'ALL' || statusFilter !== 'ALL' || searchInput.trim().length > 0
            }
            onSearchInputChange={handleSearchInputChange}
            onSearchSubmit={handleSearchSubmit}
            onResetFilters={handleResetFilters}
            onRoleFilterChange={handleRoleFilterChange}
            onStatusFilterChange={handleStatusFilterChange}
            onCreateUser={actions.openCreateEditor}
          />

          <AdminUsersTable
            users={usersQuery.data.users}
            currentUserId={currentUserId}
            pendingUserId={actions.pendingUserId}
            activeActionsUserId={activeActionsUserId}
            onToggleActionsMenu={handleToggleActionsMenu}
            onCloseActionsMenu={handleCloseActionsMenu}
            onEditUser={actions.openEditEditor}
            onToggleRole={actions.toggleUserRole}
            onResetPassword={actions.requestPasswordReset}
            onRevokeSessions={actions.requestSessionRevoke}
            onToggleStatus={actions.toggleUserStatus}
            onCopyEmail={handleCopyEmail}
            formatDateTime={formatDateTime}
            getRoleBadgeClass={getAdminRoleBadgeClassName}
            getRoleLabel={roleLabel}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={(nextSortBy) =>
              nextSortBy === sortBy ? handleSortOrderToggle() : handleSortByChange(nextSortBy)
            }
          />

          <AdminPagination
            page={usersQuery.data.page}
            totalPages={usersQuery.data.totalPages}
            isFetching={usersQuery.isFetching}
            onPrevious={handlePreviousPage}
            onNext={handleNextPage}
          />
        </CardContent>
      </Card>

      <AdminUserActionDialogs actions={actions} />
    </>
  );
}
