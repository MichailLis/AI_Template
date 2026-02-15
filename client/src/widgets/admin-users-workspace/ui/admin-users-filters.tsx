import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { RoleFilter, SortBy, SortOrder } from './admin-users-workspace.types';
import type { FormEvent } from 'react';

interface AdminUsersFiltersProps {
  searchInput: string;
  roleFilter: RoleFilter;
  sortBy: SortBy;
  sortOrder: SortOrder;
  total: number;
  isFetching: boolean;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetFilters: () => void;
  onRoleFilterChange: (nextRole: RoleFilter) => void;
  onSortByChange: (nextSortBy: SortBy) => void;
  onSortOrderToggle: () => void;
}

export function AdminUsersFilters({
  searchInput,
  roleFilter,
  sortBy,
  sortOrder,
  total,
  isFetching,
  onSearchInputChange,
  onSearchSubmit,
  onResetFilters,
  onRoleFilterChange,
  onSortByChange,
  onSortOrderToggle,
}: AdminUsersFiltersProps) {
  return (
    <>
      <form onSubmit={onSearchSubmit} className="flex flex-wrap items-center gap-2">
        <Input
          value={searchInput}
          onChange={(event) => onSearchInputChange(event.target.value)}
          placeholder="Поиск по email или имени"
          className="w-full max-w-sm"
        />
        <Button type="submit" size="sm" variant="secondary">
          Применить
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onResetFilters}>
          Сбросить
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={roleFilter === 'ALL' ? 'secondary' : 'outline'}
          onClick={() => onRoleFilterChange('ALL')}
        >
          Все
        </Button>
        <Button
          size="sm"
          variant={roleFilter === 'ADMIN' ? 'secondary' : 'outline'}
          onClick={() => onRoleFilterChange('ADMIN')}
        >
          Администраторы
        </Button>
        <Button
          size="sm"
          variant={roleFilter === 'USER' ? 'secondary' : 'outline'}
          onClick={() => onRoleFilterChange('USER')}
        >
          Пользователи
        </Button>
        <Button
          size="sm"
          variant={sortBy === 'updatedAt' ? 'secondary' : 'outline'}
          onClick={() => onSortByChange('updatedAt')}
        >
          Сортировка: Обновлены
        </Button>
        <Button
          size="sm"
          variant={sortBy === 'createdAt' ? 'secondary' : 'outline'}
          onClick={() => onSortByChange('createdAt')}
        >
          Сортировка: Созданы
        </Button>
        <Button size="sm" variant="outline" onClick={onSortOrderToggle}>
          Порядок: {sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
        </Button>
        <p className="ml-auto text-sm text-slate-500">
          Всего: {total} {isFetching ? '(обновление...)' : ''}
        </p>
      </div>
    </>
  );
}
