import { beforeEach, describe, expect, it } from 'vitest';

import { safeSessionStorage, safeStorage } from '@/shared/lib/storage';

import { dropAccessTokenOnNewBrowserSession, useAuthStore } from './store';

const resetStore = () => {
  useAuthStore.setState({ user: null, isAuthenticated: false, rememberDevice: undefined });
  safeStorage.clear();
  safeSessionStorage.clear();
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
    useAuthStore.getState().setAuth(user, 'access-token', true);

    const state = useAuthStore.getState();

    expect(state.user).toEqual(user);
    expect(state.isAuthenticated).toBe(true);
    expect(safeStorage.getItem('accessToken')).toBe('access-token');
  });

  it('never keeps a refresh token in browser storage', () => {
    // The refresh token belongs in the HttpOnly cookie only. A stale copy left
    // by an older build must be dropped when a new session starts.
    safeStorage.setItem('refreshToken', 'leaked-from-an-older-build');

    useAuthStore.getState().setAuth(user, 'access-token', true);

    expect(safeStorage.getItem('refreshToken')).toBeNull();
  });

  it('clears user, flag and both tokens on logout', () => {
    useAuthStore.getState().setAuth(user, 'access-token', true);
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
    useAuthStore.getState().setAuth(user, 'access-token', true);

    useAuthStore.getState().logout();
    useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(safeStorage.getItem('accessToken')).toBeNull();
  });

  it('keeps no access token in the persisted snapshot', () => {
    useAuthStore.getState().setAuth(user, 'access-token', true);

    const persisted = safeStorage.getItem('auth-storage');

    expect(persisted).not.toBeNull();
    expect(persisted).not.toContain('access-token');
  });

  describe('dropAccessTokenOnNewBrowserSession (#176)', () => {
    const reopenBrowser = () => safeSessionStorage.clear();

    it('drops the access token in a new browser session when the device is not remembered', () => {
      useAuthStore.getState().setAuth(user, 'access-token', false);
      reopenBrowser();

      dropAccessTokenOnNewBrowserSession();

      expect(safeStorage.getItem('accessToken')).toBeNull();
      // The user stays signed in locally: the next request refreshes or sends them to /login.
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('keeps the access token in the tab where the user signed in', () => {
      useAuthStore.getState().setAuth(user, 'access-token', false);

      dropAccessTokenOnNewBrowserSession();

      expect(safeStorage.getItem('accessToken')).toBe('access-token');
    });

    it('keeps the access token on a remembered device', () => {
      useAuthStore.getState().setAuth(user, 'access-token', true);
      reopenBrowser();

      dropAccessTokenOnNewBrowserSession();

      expect(safeStorage.getItem('accessToken')).toBe('access-token');
    });

    it('treats a session persisted before #176 as remembered', () => {
      useAuthStore.setState({ user, isAuthenticated: true, rememberDevice: undefined });
      safeStorage.setItem('accessToken', 'access-token');

      dropAccessTokenOnNewBrowserSession();

      expect(safeStorage.getItem('accessToken')).toBe('access-token');
    });
  });
});
