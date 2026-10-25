import { safeStorage } from '../lib/storage';

import type { AxiosInstance } from 'axios';

const configuredApis = new WeakSet<AxiosInstance>();

interface InterceptorRuntimeHooks {
  onAuthRefreshFailed?: () => void;
}

interface RefreshTokens {
  accessToken: string;
}

class RefreshError extends Error {
  readonly status?: number;

  constructor(status?: number) {
    super('Refresh failed');
    this.status = status;
  }
}

const REFRESH_RETRY_DELAYS_MS = [300, 600];
const waitMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let runtimeHooks: InterceptorRuntimeHooks = {};
let refreshPromise: Promise<RefreshTokens> | null = null;
let isAuthRefreshRedirecting = false;

export const configureInterceptorsRuntime = (hooks: InterceptorRuntimeHooks) => {
  runtimeHooks = hooks;
};

const isSessionRejected = (error: unknown) =>
  error instanceof RefreshError && (error.status === 401 || error.status === 403);

const redirectToLoginOnExpiredSession = () => {
  if (typeof window === 'undefined' || window.location.pathname === '/login') {
    return;
  }
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const loginUrl = new URL('/login', window.location.origin);
  loginUrl.searchParams.set('reason', 'session_expired');
  if (currentPath && currentPath !== '/') {
    loginUrl.searchParams.set('from', currentPath);
  }
  window.location.href = `${loginUrl.pathname}${loginUrl.search}${loginUrl.hash}`;
};

export const setupInterceptors = (api: AxiosInstance) => {
  if (configuredApis.has(api)) {
    return;
  }

  configuredApis.add(api);

  const refreshTokens = async (): Promise<RefreshTokens> => {
    // We need to use the same baseURL
    const baseURL = api.defaults.baseURL || '';
    let response: Response;
    try {
      response = await fetch(`${baseURL}/auth/refresh`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch {
      throw new RefreshError();
    }

    if (!response.ok) {
      throw new RefreshError(response.status);
    }

    return (await response.json()) as RefreshTokens;
  };

  // Only 401/403 mean the session is gone; network errors and 5xx are retried, not a logout.
  const refreshWithRetry = async (): Promise<RefreshTokens> => {
    for (const delay of REFRESH_RETRY_DELAYS_MS) {
      try {
        return await refreshTokens();
      } catch (error) {
        if (isSessionRejected(error)) {
          throw error;
        }
        await waitMs(delay);
      }
    }
    return refreshTokens();
  };

  // One refresh for all tabs: a tab that waited for the lock takes the token another tab already stored.
  const refreshOnce = (staleToken: string | null): Promise<RefreshTokens> => {
    const run = async (): Promise<RefreshTokens> => {
      const current = safeStorage.getItem('accessToken');
      if (current && current !== staleToken) {
        return { accessToken: current };
      }
      const tokens = await refreshWithRetry();
      safeStorage.setItem('accessToken', tokens.accessToken);
      safeStorage.removeItem('refreshToken');
      return tokens;
    };
    return typeof navigator !== 'undefined' && navigator.locks
      ? navigator.locks.request('auth-refresh', run)
      : run();
  };

  api.interceptors.request.use((config) => {
    const token = safeStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  api.interceptors.response.use(
    (response) => {
      return response.data;
    },
    async (error) => {
      const originalRequest = error.config;
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            isAuthRefreshRedirecting = false;
            const staleToken =
              originalRequest.headers?.Authorization?.toString().replace('Bearer ', '') ?? null;
            refreshPromise = refreshOnce(staleToken).finally(() => {
              refreshPromise = null;
            });
          }

          const tokens = await refreshPromise;

          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          if (!isSessionRejected(refreshError) || isAuthRefreshRedirecting) {
            return Promise.reject(refreshError);
          }

          isAuthRefreshRedirecting = true;

          safeStorage.removeItem('accessToken');
          safeStorage.removeItem('refreshToken');

          runtimeHooks.onAuthRefreshFailed?.();
          redirectToLoginOnExpiredSession();
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    },
  );
};
