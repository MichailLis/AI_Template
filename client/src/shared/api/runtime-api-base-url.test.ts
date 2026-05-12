import { beforeEach, describe, expect, it, vi } from 'vitest';

const importRuntimeApi = async () => {
  const apiModule = await import('./api');
  const runtimeModule = await import('./runtime-api-base-url');

  apiModule.configureApiBaseUrl('http://localhost:3000');

  return {
    api: apiModule.default,
    discoverAndConfigureApiBaseUrl: runtimeModule.discoverAndConfigureApiBaseUrl,
  };
};

const mockDiscoveryResponse = (payload: { baseUrl?: string | null }, status = 200) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  );
};

describe('discoverAndConfigureApiBaseUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('accepts valid HTTP(S) base URLs from runtime discovery', async () => {
    mockDiscoveryResponse({ baseUrl: 'https://api.example.test' });
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('https://api.example.test');

    expect(api.defaults.baseURL).toBe('https://api.example.test');
  });

  it('ignores malformed runtime discovery values without changing the configured base URL', async () => {
    mockDiscoveryResponse({ baseUrl: 'file:///tmp/api' });
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('keeps the current base URL when discovery returns an unsuccessful response', async () => {
    mockDiscoveryResponse({ baseUrl: 'https://api.example.test' }, 503);
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('keeps the current base URL when discovery omits a usable base URL', async () => {
    mockDiscoveryResponse({});
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');
    expect(api.defaults.baseURL).toBe('http://localhost:3000');

    vi.resetModules();
    mockDiscoveryResponse({ baseUrl: null });
    const secondRuntimeApi = await importRuntimeApi();

    await expect(secondRuntimeApi.discoverAndConfigureApiBaseUrl()).resolves.toBe(
      'http://localhost:3000',
    );
    expect(secondRuntimeApi.api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('returns the current base URL without fetching outside a browser runtime', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('window', undefined);
    const { discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deduplicates concurrent discovery requests', async () => {
    mockDiscoveryResponse({ baseUrl: 'http://127.0.0.1:3001' });
    const fetchMock = vi.mocked(fetch);
    const { discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(
      Promise.all([discoverAndConfigureApiBaseUrl(), discoverAndConfigureApiBaseUrl()]),
    ).resolves.toEqual(['http://127.0.0.1:3001', 'http://127.0.0.1:3001']);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
