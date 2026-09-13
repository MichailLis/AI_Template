import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { useAdminControllerGetUsers } from '@/shared/api/generated/admin/admin';

import { buildUsersQueryParams } from './admin-users-workspace.utils';

import type { RoleFilter, SortBy, SortOrder, StatusFilter } from './admin-users-workspace.types';
import type { FormEvent } from 'react';

const LIMIT = 10;

/**
 * Удаления пользователей нет, есть только отключение, поэтому отключенные аккаунты по умолчанию
 * скрыты: иначе тестовые учетные записи копились в общем списке.
 */
const DEFAULT_STATUS_FILTER: StatusFilter = 'ACTIVE';

/** Список, фильтры и меню строк. Изменения пользователей живут в `useAdminUserActions`. */
export function useAdminUsersWorkspace() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(DEFAULT_STATUS_FILTER);
  const [sortBy, setSortBy] = useState<SortBy>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [page, setPage] = useState(1);
  const [activeActionsUserId, setActiveActionsUserId] = useState<number | null>(null);

  const queryParams = useMemo(() => {
    return buildUsersQueryParams({
      page,
      limit: LIMIT,
      sortBy,
      sortOrder,
      searchQuery,
      roleFilter,
      statusFilter,
    });
  }, [page, roleFilter, searchQuery, sortBy, sortOrder, statusFilter]);

  const usersQuery = useAdminControllerGetUsers(queryParams, {
    query: {
      placeholderData: (previousData) => previousData,
    },
  });

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleRoleFilterChange = (nextRole: RoleFilter) => {
    setRoleFilter(nextRole);
    setPage(1);
  };

  const handleStatusFilterChange = (nextStatus: StatusFilter) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter(DEFAULT_STATUS_FILTER);
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

  const handleToggleActionsMenu = (userId: number) => {
    setActiveActionsUserId((previous) => (previous === userId ? null : userId));
  };

  const handleCloseActionsMenu = () => {
    setActiveActionsUserId(null);
  };

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      toast.success('Email скопирован');
    } catch {
      toast.error('Не удалось скопировать email');
    }
  };

  const handlePreviousPage = () => {
    setPage((previous) => Math.max(1, previous - 1));
  };

  const handleNextPage = () => {
    setPage((previous) => previous + 1);
  };

  const hasActiveFilters =
    roleFilter !== 'ALL' || statusFilter !== DEFAULT_STATUS_FILTER || searchInput.trim().length > 0;

  return {
    currentUserId,
    searchInput,
    roleFilter,
    statusFilter,
    hasActiveFilters,
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
  };
}
