import { getApiErrorMessage as getSharedApiErrorMessage } from '@/shared/lib/api-error';
import { formatDateTime } from '@/shared/lib/date-format';

interface UsersQueryParamsInput {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  roleFilter: 'ALL' | 'USER' | 'ADMIN';
  statusFilter: 'ALL' | 'ACTIVE' | 'DEACTIVATED';
}

export { formatDateTime };

export const getApiErrorMessage = (error: unknown) => getSharedApiErrorMessage(error);

export const buildUsersQueryParams = ({
  page,
  limit,
  sortBy,
  sortOrder,
  searchQuery,
  roleFilter,
  statusFilter,
}: UsersQueryParamsInput) => {
  return {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(searchQuery ? { search: searchQuery } : {}),
    ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
    ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}),
  };
};
