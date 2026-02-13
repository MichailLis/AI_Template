import { Copy, MoreHorizontal, ShieldCheck, ShieldOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import {
  useAdminControllerGetUsers,
  useAdminControllerUpdateUserRole,
} from '@/shared/api/generated/admin/admin';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

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

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

type RoleFilter = 'ALL' | 'USER' | 'ADMIN';
type SortBy = 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const getApiErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Не удалось выполнить запрос';
  }

  const response = error.response;

  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'Не удалось выполнить запрос';
  }

  const data = response.data;

  if (typeof data !== 'object' || data === null) {
    return 'Не удалось выполнить запрос';
  }

  if (
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error
  ) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Не удалось выполнить запрос';
};

export default function AdminUsersPage() {
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
    return {
      page,
      limit,
      sortBy,
      sortOrder,
      ...(searchQuery ? { search: searchQuery } : {}),
      ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
    };
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
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Поиск по email или имени"
            className="w-full max-w-sm"
          />
          <Button type="submit" size="sm" variant="secondary">
            Применить
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleResetFilters}>
            Сбросить
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={roleFilter === 'ALL' ? 'secondary' : 'outline'}
            onClick={() => handleRoleFilterChange('ALL')}
          >
            Все
          </Button>
          <Button
            size="sm"
            variant={roleFilter === 'ADMIN' ? 'secondary' : 'outline'}
            onClick={() => handleRoleFilterChange('ADMIN')}
          >
            Администраторы
          </Button>
          <Button
            size="sm"
            variant={roleFilter === 'USER' ? 'secondary' : 'outline'}
            onClick={() => handleRoleFilterChange('USER')}
          >
            Пользователи
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'updatedAt' ? 'secondary' : 'outline'}
            onClick={() => handleSortByChange('updatedAt')}
          >
            Сортировка: Обновлены
          </Button>
          <Button
            size="sm"
            variant={sortBy === 'createdAt' ? 'secondary' : 'outline'}
            onClick={() => handleSortByChange('createdAt')}
          >
            Сортировка: Созданы
          </Button>
          <Button size="sm" variant="outline" onClick={handleSortOrderToggle}>
            Порядок: {sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
          </Button>
          <p className="ml-auto text-sm text-slate-500">
            Всего: {usersQuery.data.total} {usersQuery.isFetching ? '(обновление...)' : ''}
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Пользователь</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead>Обновлен</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                  По текущим фильтрам пользователи не найдены.
                </TableCell>
              </TableRow>
            ) : null}
            {usersQuery.data.users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div>
                    <p className="font-medium text-slate-900">{user.email}</p>
                    <p className="text-xs text-slate-500">ID: {user.id}</p>
                    {user.name ? <p className="text-xs text-slate-500">{user.name}</p> : null}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={roleBadgeClass(user.role)}>
                    {roleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">{formatDateTime(user.createdAt)}</TableCell>
                <TableCell className="text-slate-600">{formatDateTime(user.updatedAt)}</TableCell>
                <TableCell>
                  <div className="relative flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Действия для ${user.email}`}
                      onClick={() =>
                        setActiveActionsUserId((previous) =>
                          previous === user.id ? null : user.id,
                        )
                      }
                      disabled={pendingUserId === user.id}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>

                    {activeActionsUserId === user.id ? (
                      <Card className="absolute right-0 top-10 z-20 w-48 border-slate-200 shadow-md">
                        <CardContent className="space-y-2 p-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="w-full justify-start"
                            disabled={
                              pendingUserId === user.id ||
                              (currentUser?.id === user.id && user.role === 'ADMIN')
                            }
                            onClick={() =>
                              handleRoleToggle(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')
                            }
                          >
                            {pendingUserId === user.id ? (
                              'Обновление...'
                            ) : user.role === 'ADMIN' ? (
                              <>
                                <ShieldOff className="mr-2 h-4 w-4" />
                                Снять права администратора
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="mr-2 h-4 w-4" />
                                Сделать администратором
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start"
                            onClick={() => {
                              void handleCopyEmail(user.email);
                              setActiveActionsUserId(null);
                            }}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Скопировать email
                          </Button>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">
            Страница {usersQuery.data.page} из {usersQuery.data.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((previous) => Math.max(1, previous - 1))}
              disabled={usersQuery.data.page <= 1 || usersQuery.isFetching}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((previous) => previous + 1)}
              disabled={usersQuery.data.page >= usersQuery.data.totalPages || usersQuery.isFetching}
            >
              Далее
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
