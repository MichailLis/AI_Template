interface UsersQueryParamsInput {
  page: number;
  limit: number;
  sortBy: 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  roleFilter: 'ALL' | 'USER' | 'ADMIN';
}

export const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

export const getApiErrorMessage = (error: unknown) => {
  if (!isRecord(error) || !('response' in error) || !isRecord(error.response)) {
    return 'Не удалось выполнить запрос';
  }

  if (!('data' in error.response) || !isRecord(error.response.data)) {
    return 'Не удалось выполнить запрос';
  }

  const data = error.response.data;

  if ('error' in data && isRecord(data.error) && 'message' in data.error) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Не удалось выполнить запрос';
};

export const buildUsersQueryParams = ({
  page,
  limit,
  sortBy,
  sortOrder,
  searchQuery,
  roleFilter,
}: UsersQueryParamsInput) => {
  return {
    page,
    limit,
    sortBy,
    sortOrder,
    ...(searchQuery ? { search: searchQuery } : {}),
    ...(roleFilter !== 'ALL' ? { role: roleFilter } : {}),
  };
};
