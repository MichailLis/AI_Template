import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { RoleFilter } from './admin-users-workspace.types';
import type { FormEvent } from 'react';

interface AdminUsersFiltersProps {
  searchInput: string;
  roleFilter: RoleFilter;
  total: number;
  isFetching: boolean;
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetFilters: () => void;
  onRoleFilterChange: (nextRole: RoleFilter) => void;
}

const ROLE_TABS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ADMIN', label: 'Администраторы' },
  { value: 'USER', label: 'Пользователи' },
];

const formatTotal = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

/**
 * Фильтр по роли и поиск. Сортировка отсюда убрана: она живет в заголовках таблицы, где ей и место,
 * — раньше в одном ряду стояли шесть кнопок трех разных назначений и читались как один набор.
 */
export function AdminUsersFilters({
  searchInput,
  roleFilter,
  total,
  isFetching,
  hasActiveFilters,
  onSearchInputChange,
  onSearchSubmit,
  onResetFilters,
  onRoleFilterChange,
}: AdminUsersFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <AdminTabs
        ariaLabel="Роль пользователя"
        tabs={ROLE_TABS}
        activeTab={roleFilter}
        onTabChange={onRoleFilterChange}
      />

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex items-center gap-2">
          <Input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Поиск по email или имени…"
            aria-label="Поиск по email или имени"
            className={`w-full sm:w-72 ${adminClassNames.toolbar.input}`}
          />
          <Button type="submit" size="sm" variant="outline">
            Найти
          </Button>
        </form>

        {hasActiveFilters ? (
          <Button type="button" size="sm" variant="ghost" onClick={onResetFilters}>
            Сбросить
          </Button>
        ) : null}

        <p className={adminClassNames.filters.total}>
          {isFetching ? 'Обновляем…' : `Всего: ${formatTotal(total)}`}
        </p>
      </div>
    </div>
  );
}
