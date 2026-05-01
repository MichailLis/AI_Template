import { safeStorage } from '../lib/storage';

import type { AxiosInstance } from 'axios';

const configuredApis = new WeakSet<AxiosInstance>();

interface InterceptorRuntimeHooks {
  onAuthRefreshFailed?: () => void;
}

interface RefreshTokens {
  accessToken: string;
  refreshToken: string;
}

let runtimeHooks: InterceptorRuntimeHooks = {};
let refreshPromise: Promise<RefreshTokens> | null = null;
let isAuthRefreshRedirecting = false;

export const configureInterceptorsRuntime = (hooks: InterceptorRuntimeHooks) => {
  runtimeHooks = hooks;
};

export const setupInterceptors = (api: AxiosInstance) => {
  if (configuredApis.has(api)) {
    return;
  }

  configuredApis.add(api);

  const refreshTokens = async (): Promise<RefreshTokens> => {
    const refreshToken = safeStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    // We need to use the same baseURL
    const baseURL = api.defaults.baseURL || '';
    const response = await fetch(`${baseURL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshToken}`,
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
            refreshPromise = refreshTokens().finally(() => {
              refreshPromise = null;
            });
          }

          const tokens = await refreshPromise;

          safeStorage.setItem('accessToken', tokens.accessToken);
          safeStorage.setItem('refreshToken', tokens.refreshToken);

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

          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    },
  );
};
