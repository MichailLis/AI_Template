import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import {
  useAdminControllerGetUsers,
  useAdminControllerUpdateUserRole,
} from '@/shared/api/generated/admin/admin';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import { AdminUsersFilters } from './admin-users-filters';
import { AdminUsersPagination } from './admin-users-pagination';
import { AdminUsersTable } from './admin-users-table';
import {
  buildUsersQueryParams,
  formatDateTime,
  getApiErrorMessage,
} from './admin-users-workspace.utils';

import type { RoleFilter, SortBy, SortOrder } from './admin-users-workspace.types';
import type { FormEvent } from 'react';

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
  const currentUser = useAuthStore((state) => state.user);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [activeActionsUserId, setActiveActionsUserId] = useState<number | null>(null);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const limit = 10;

  const queryParams = useMemo(() => {
    return buildUsersQueryParams({
      page,
      limit,
      sortBy,
      sortOrder,
      searchQuery,
      roleFilter,
    });
  }, [page, roleFilter, searchQuery, sortBy, sortOrder]);

  const usersQuery = useAdminControllerGetUsers(queryParams, {
    query: {
      placeholderData: (previousData) => previousData,
    },
  });
  const updateRoleMutation = useAdminControllerUpdateUserRole();

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleRoleFilterChange = (nextRole: RoleFilter) => {
    setRoleFilter(nextRole);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('ALL');
    setSortBy('updatedAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSortByChange = (nextSortBy: SortBy) => {
    setSortBy(nextSortBy);
    setPage(1);
  };

  const handleSortOrderToggle = () => {
    setSortOrder((previous) => (previous === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  const handleRoleToggle = (targetUserId: number, nextRole: 'USER' | 'ADMIN') => {
    setPendingUserId(targetUserId);

    updateRoleMutation.mutate(
      {
        id: targetUserId,
        data: { role: nextRole },
      },
      {
        onSuccess: () => {
          toast.success(`Роль обновлена: ${roleLabel(nextRole)}`);
          usersQuery.refetch();
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
        onSettled: () => {
          setPendingUserId(null);
          setActiveActionsUserId(null);
        },
      },
    );
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email скопирован');
    } catch {
      toast.error('Не удалось скопировать email');
    }
  };

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
          onSearchInputChange={setSearchInput}
          onSearchSubmit={handleSearchSubmit}
          onResetFilters={handleResetFilters}
          onRoleFilterChange={handleRoleFilterChange}
          onSortByChange={handleSortByChange}
          onSortOrderToggle={handleSortOrderToggle}
        />

        <AdminUsersTable
          users={usersQuery.data.users}
          currentUserId={currentUser?.id}
          pendingUserId={pendingUserId}
          activeActionsUserId={activeActionsUserId}
          onToggleActionsMenu={(userId) =>
            setActiveActionsUserId((previous) => (previous === userId ? null : userId))
          }
          onCloseActionsMenu={() => setActiveActionsUserId(null)}
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
          onPrevious={() => setPage((previous) => Math.max(1, previous - 1))}
          onNext={() => setPage((previous) => previous + 1)}
        />
      </CardContent>
    </Card>
  );
}
