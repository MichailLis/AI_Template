import { adminClassNames, getAdminRoleBadgeClassName } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { AdminUsersFilters } from './admin-users-filters';
import { AdminUsersTable } from './admin-users-table';
import { formatDateTime } from './admin-users-workspace.utils';
import { useAdminUsersWorkspace } from './use-admin-users-workspace';

const roleLabel = (role: string) => {
  if (role === 'ADMIN') {
    return 'Администратор';
  }

  return 'Пользователь';
};

export function AdminUsersWorkspace() {
  const {
    currentUserId,
    searchInput,
    roleFilter,
    sortBy,
    sortOrder,
    activeActionsUserId,
    pendingUserId,
    usersQuery,
    handleSearchInputChange,
    handleSearchSubmit,
    handleRoleFilterChange,
    handleResetFilters,
    handleSortByChange,
    handleSortOrderToggle,
    handleToggleActionsMenu,
    handleCloseActionsMenu,
    handleRoleToggle,
    handleCopyEmail,
    handlePreviousPage,
    handleNextPage,
  } = useAdminUsersWorkspace();

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
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle>Пользователи</CardTitle>
        <CardDescription>Поиск, фильтры, пагинация и управление ролями.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <AdminUsersFilters
          searchInput={searchInput}
          roleFilter={roleFilter}
          sortBy={sortBy}
          sortOrder={sortOrder}
          total={usersQuery.data.total}
          isFetching={usersQuery.isFetching}
          onSearchInputChange={handleSearchInputChange}
          onSearchSubmit={handleSearchSubmit}
          onResetFilters={handleResetFilters}
          onRoleFilterChange={handleRoleFilterChange}
          onSortByChange={handleSortByChange}
          onSortOrderToggle={handleSortOrderToggle}
        />

        <AdminUsersTable
          users={usersQuery.data.users}
          currentUserId={currentUserId}
          pendingUserId={pendingUserId}
          activeActionsUserId={activeActionsUserId}
          onToggleActionsMenu={handleToggleActionsMenu}
          onCloseActionsMenu={handleCloseActionsMenu}
          onToggleRole={handleRoleToggle}
          onCopyEmail={handleCopyEmail}
          formatDateTime={formatDateTime}
          getRoleBadgeClass={getAdminRoleBadgeClassName}
          getRoleLabel={roleLabel}
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
  );
}
