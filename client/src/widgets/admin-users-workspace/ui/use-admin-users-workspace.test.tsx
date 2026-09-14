import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminUsersWorkspace } from './use-admin-users-workspace';

const getUsersMock = vi.fn((..._args: unknown[]) => ({
  data: undefined,
  isLoading: false,
  isError: false,
}));

vi.mock('@/shared/api/generated/admin/admin', () => ({
  useAdminControllerGetUsers: (...args: unknown[]) => getUsersMock(...args),
}));

vi.mock('@/entities/session', () => ({
  useAuthStore: (selector: (state: { user: { id: number } }) => unknown) =>
    selector({ user: { id: 1 } }),
}));

const lastRequestedParams = () => getUsersMock.mock.calls.at(-1)?.[0] as Record<string, unknown>;

/**
 * Находка аудита FLOW-06: удаления пользователей нет, есть только отключение, и отключенные
 * тестовые аккаунты копились в общем списке. По умолчанию список показывает активных.
 */
describe('useAdminUsersWorkspace status filter', () => {
  beforeEach(() => {
    getUsersMock.mockClear();
  });

  it('hides deactivated accounts by default', () => {
    const { result } = renderHook(() => useAdminUsersWorkspace());

    expect(result.current.statusFilter).toBe('ACTIVE');
    expect(lastRequestedParams()).toMatchObject({ status: 'ACTIVE' });
    expect(result.current.hasActiveFilters).toBe(false);
  });

  it('counts showing every status as a changed filter and resets back to active accounts', () => {
    const { result } = renderHook(() => useAdminUsersWorkspace());

    act(() => {
      result.current.handleStatusFilterChange('ALL');
    });

    expect(result.current.hasActiveFilters).toBe(true);
    expect(lastRequestedParams()).not.toHaveProperty('status');

    act(() => {
      result.current.handleResetFilters();
    });

    expect(result.current.statusFilter).toBe('ACTIVE');
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
