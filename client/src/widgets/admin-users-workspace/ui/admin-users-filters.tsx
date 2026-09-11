import { UserPlus } from 'lucide-react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { AdminTabs } from '@/shared/ui/admin-tabs';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { RoleFilter, StatusFilter } from './admin-users-workspace.types';
import type { FormEvent } from 'react';

interface AdminUsersFiltersProps {
  searchInput: string;
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  total: number;
  isFetching: boolean;
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onResetFilters: () => void;
  onRoleFilterChange: (nextRole: RoleFilter) => void;
  onStatusFilterChange: (nextStatus: StatusFilter) => void;
  onCreateUser: () => void;
}

const ROLE_TABS: Array<{ value: RoleFilter; label: string }> = [
  { value: 'ALL', label: 'Все' },
  { value: 'ADMIN', label: 'Администраторы' },
  { value: 'USER', label: 'Пользователи' },
];

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'ALL', label: 'Любой статус' },
  { value: 'ACTIVE', label: 'Активные' },
  { value: 'DEACTIVATED', label: 'Отключённые' },
];

const formatTotal = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

/**
 * Фильтр по роли и поиск. Сортировка отсюда убрана: она живет в заголовках таблицы, где ей и место,
 * — раньше в одном ряду стояли шесть кнопок трех разных назначений и читались как один набор.
 */
export function AdminUsersFilters({
  searchInput,
  roleFilter,
  statusFilter,
  total,
  isFetching,
  hasActiveFilters,
  onSearchInputChange,
  onSearchSubmit,
  onResetFilters,
  onRoleFilterChange,
  onStatusFilterChange,
  onCreateUser,
}: AdminUsersFiltersProps) {
  // Два ряда, а не один: когда поиск, статус, итог и кнопка создания стояли в одной строке с
  // вкладками, на обычной ширине экрана вкладки ролей переносились на вторую строку.
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <AdminTabs
          ariaLabel="Роль пользователя"
          tabs={ROLE_TABS}
          activeTab={roleFilter}
          onTabChange={onRoleFilterChange}
        />

        <Button type="button" size="sm" onClick={onCreateUser}>
          <UserPlus aria-hidden="true" className="size-4" />
          Добавить пользователя
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={onSearchSubmit} className="flex w-full items-center gap-2 sm:w-auto">
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

        <AdminSelectField
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value as StatusFilter)}
          aria-label="Статус пользователя"
          className="w-auto"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelectField>

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
