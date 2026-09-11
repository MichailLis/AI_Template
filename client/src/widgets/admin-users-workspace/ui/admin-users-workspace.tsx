import { adminClassNames, getAdminRoleBadgeClassName } from '@/shared/ui/admin-design-tokens';
import { AdminPagination } from '@/shared/ui/admin-pagination';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';

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
      <CardContent className="flex flex-col gap-4 p-4">
        <AdminUsersFilters
          searchInput={searchInput}
          roleFilter={roleFilter}
          total={usersQuery.data.total}
          isFetching={usersQuery.isFetching}
          hasActiveFilters={roleFilter !== 'ALL' || searchInput.trim().length > 0}
          onSearchInputChange={handleSearchInputChange}
          onSearchSubmit={handleSearchSubmit}
          onResetFilters={handleResetFilters}
          onRoleFilterChange={handleRoleFilterChange}
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
  );
}
