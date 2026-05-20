import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { safeStorage } from '../lib/storage';

import { configureInterceptorsRuntime, setupInterceptors } from './interceptors';

const createUnauthorizedError = (config: InternalAxiosRequestConfig) => {
  const response = {
    data: { success: false },
    status: 401,
    statusText: 'Unauthorized',
    headers: {},
    config,
  } satisfies AxiosResponse;

  return new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, null, response);
};

const createApiWithUnauthorizedAdapter = () => {
  const adapter = vi.fn<AxiosAdapter>(async (config) => {
    throw createUnauthorizedError(config);
  });
  const api = axios.create({
    baseURL: 'http://api.test',
    adapter,
  });

  setupInterceptors(api);

  return api;
};

const mockFailedRefresh = () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
};

const mockPendingFailedRefresh = () => {
  let resolveRefresh: ((response: Response) => void) | null = null;
  const refreshResponse = new Promise<Response>((resolve) => {
    resolveRefresh = resolve;
  });

  vi.stubGlobal('fetch', vi.fn().mockReturnValue(refreshResponse));

  return () => {
    resolveRefresh?.(
      new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
};

const waitForRefreshFailureCycleReset = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('setupInterceptors', () => {
  beforeEach(() => {
    safeStorage.clear();
    mockFailedRefresh();
    window.history.replaceState({}, '', '/login');
  });

  afterEach(() => {
    configureInterceptorsRuntime({});
    safeStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('clears storage and calls the auth refresh failure hook for two separate failed cycles', async () => {
    const onAuthRefreshFailed = vi.fn();
    configureInterceptorsRuntime({ onAuthRefreshFailed });
    const api = createApiWithUnauthorizedAdapter();

    safeStorage.setItem('accessToken', 'first-access');
    safeStorage.setItem('refreshToken', 'first-refresh');

    await expect(api.get('/protected')).rejects.toThrow('Refresh failed');

    expect(safeStorage.getItem('accessToken')).toBeNull();
    expect(safeStorage.getItem('refreshToken')).toBeNull();
    expect(onAuthRefreshFailed).toHaveBeenCalledTimes(1);

    await waitForRefreshFailureCycleReset();

    safeStorage.setItem('accessToken', 'second-access');
    safeStorage.setItem('refreshToken', 'second-refresh');

    await expect(api.get('/protected')).rejects.toThrow('Refresh failed');

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(safeStorage.getItem('accessToken')).toBeNull();
    expect(safeStorage.getItem('refreshToken')).toBeNull();
    expect(onAuthRefreshFailed).toHaveBeenCalledTimes(2);
  });

  it('calls the auth refresh failure hook once for concurrent failures in one refresh cycle', async () => {
    const failRefresh = mockPendingFailedRefresh();
    const onAuthRefreshFailed = vi.fn();
    configureInterceptorsRuntime({ onAuthRefreshFailed });
    const api = createApiWithUnauthorizedAdapter();

    safeStorage.setItem('accessToken', 'access');
    safeStorage.setItem('refreshToken', 'refresh');

    const firstRequest = api.get('/protected');
    const secondRequest = api.get('/protected');

    await vi.waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    failRefresh();

    await expect(Promise.allSettled([firstRequest, secondRequest])).resolves.toEqual([
      expect.objectContaining({ status: 'rejected' }),
      expect.objectContaining({ status: 'rejected' }),
    ]);

    expect(safeStorage.getItem('accessToken')).toBeNull();
    expect(safeStorage.getItem('refreshToken')).toBeNull();
    expect(onAuthRefreshFailed).toHaveBeenCalledTimes(1);
  });
});
