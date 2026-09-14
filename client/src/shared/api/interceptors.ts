import { safeStorage } from '../lib/storage';

import type { AxiosInstance } from 'axios';

const configuredApis = new WeakSet<AxiosInstance>();

interface InterceptorRuntimeHooks {
  onAuthRefreshFailed?: () => void;
}

interface RefreshTokens {
  accessToken: string;
}

let runtimeHooks: InterceptorRuntimeHooks = {};
let refreshPromise: Promise<RefreshTokens> | null = null;
let isAuthRefreshRedirecting = false;

export const configureInterceptorsRuntime = (hooks: InterceptorRuntimeHooks) => {
  runtimeHooks = hooks;
};

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
    const response = await fetch(`${baseURL}/auth/refresh`, {
      credentials: 'include',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Refresh failed');
    }

    return (await response.json()) as RefreshTokens;
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
            refreshPromise = refreshTokens().finally(() => {
              refreshPromise = null;
            });
          }

          const tokens = await refreshPromise;

          safeStorage.setItem('accessToken', tokens.accessToken);
          safeStorage.removeItem('refreshToken');

          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          if (isAuthRefreshRedirecting) {
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
