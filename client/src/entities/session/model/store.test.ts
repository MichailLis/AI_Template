import { beforeEach, describe, expect, it } from 'vitest';

import { safeStorage } from '@/shared/lib/storage';

import { useAuthStore } from './store';

const resetStore = () => {
  useAuthStore.setState({ user: null, isAuthenticated: false });
  safeStorage.clear();
};

const user = { id: 1, email: 'operator@example.com', name: 'Operator' };

describe('useAuthStore', () => {
  beforeEach(resetStore);

  it('starts unauthenticated', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('stores the access token and marks the session authenticated', () => {
    useAuthStore.getState().setAuth(user, 'access-token');

    const state = useAuthStore.getState();

    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(safeStorage.getItem('accessToken')).toBe('access-token');
  });

  it('never keeps a refresh token in browser storage', () => {
    // The refresh token belongs in the HttpOnly cookie only. A stale copy left
    // by an older build must be dropped when a new session starts.
    safeStorage.setItem('refreshToken', 'leaked-from-an-older-build');

    useAuthStore.getState().setAuth(user, 'access-token');

    expect(safeStorage.getItem('refreshToken')).toBeNull();
  });

  it('clears user, flag and both tokens on logout', () => {
    useAuthStore.getState().setAuth(user, 'access-token');
    safeStorage.setItem('refreshToken', 'should-not-survive');

    useAuthStore.getState().logout();

    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(safeStorage.getItem('accessToken')).toBeNull();
    expect(safeStorage.getItem('refreshToken')).toBeNull();
  });

  it('is idempotent when logout runs twice', () => {
    // App.tsx wires logout to onAuthRefreshFailed, and several queued requests
    // can fail their refresh at once.
    useAuthStore.getState().setAuth(user, 'access-token');

    useAuthStore.getState().logout();
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(safeStorage.getItem('accessToken')).toBeNull();
  });

  it('keeps no access token in the persisted snapshot', () => {
    useAuthStore.getState().setAuth(user, 'access-token');

    const persisted = safeStorage.getItem('auth-storage');

    expect(persisted).not.toBeNull();
    expect(persisted).not.toContain('access-token');
  });
});
