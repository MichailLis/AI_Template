import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { AdminUsersFilters } from './admin-users-filters';
import { AdminUsersPagination } from './admin-users-pagination';
import { AdminUsersTable } from './admin-users-table';
import { formatDateTime } from './admin-users-workspace.utils';
import { useAdminUsersWorkspace } from './use-admin-users-workspace';

const roleBadgeClass = (role: string) => {
  if (role === 'ADMIN') {
    return 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100';
};

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
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6 text-sm text-slate-500">Загрузка пользователей...</CardContent>
      </Card>
    );
  }

  if (usersQuery.isError || !usersQuery.data) {
    return (
      <Card className="border-red-200 bg-red-50 shadow-sm">
        <CardContent className="space-y-4 p-6 text-sm text-red-700">
          <p>Не удалось загрузить пользователей.</p>
          <Button variant="outline" size="sm" onClick={() => usersQuery.refetch()}>
            Повторить
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle>Пользователи</CardTitle>
        <CardDescription>Поиск, фильтры, пагинация и управление ролями.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
          getRoleBadgeClass={roleBadgeClass}
          getRoleLabel={roleLabel}
        />

        <AdminUsersPagination
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
