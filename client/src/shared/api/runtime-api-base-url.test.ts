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

const API_SWAGGER_PATH = '/api-json';
const REQUIRED_API_PATHS = [
  '/auth/signin',
  '/admin/tests/public-links',
  '/tests/public/links/{code}',
] as const;

const createSwaggerDocument = (paths: readonly string[] = REQUIRED_API_PATHS) => ({
  openapi: '3.0.0',
  paths: Object.fromEntries(paths.map((path) => [path, { get: {} }])),
});

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const mockDiscoveryResponse = (payload: { baseUrl?: string | null }, status = 200) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload, status)));
};

const mockValidDiscoveryResponse = (baseUrl: string) => {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ baseUrl }))
      .mockResolvedValueOnce(jsonResponse(createSwaggerDocument())),
  );
};

const mockDiscoveryThenProbeResponse = (baseUrl: string, probeResponse: Response) => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValueOnce(jsonResponse({ baseUrl })).mockResolvedValueOnce(probeResponse),
  );
};

describe('discoverAndConfigureApiBaseUrl', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('accepts valid HTTP(S) base URLs after probing the project Swagger document', async () => {
    mockValidDiscoveryResponse('https://api.example.test');
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('https://api.example.test');

    expect(fetch).toHaveBeenCalledWith('/__api-base-url', {
      method: 'GET',
      cache: 'no-store',
    });
    expect(fetch).toHaveBeenCalledWith(`https://api.example.test${API_SWAGGER_PATH}`, {
      method: 'GET',
      cache: 'no-store',
    });
    expect(api.defaults.baseURL).toBe('https://api.example.test');
  });

  it('rejects discovered HTTP(S) base URLs when the API probe is not this project', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(jsonResponse({ baseUrl: 'https://api.example.test' }))
        .mockResolvedValueOnce(jsonResponse(createSwaggerDocument(['/auth/signin']))),
    );
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(fetch).toHaveBeenCalledWith(`https://api.example.test${API_SWAGGER_PATH}`, {
      method: 'GET',
      cache: 'no-store',
    });
    expect(api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('rejects discovered HTTP(S) base URLs when the API probe fails', async () => {
    mockDiscoveryThenProbeResponse(
      'https://api.example.test',
      new Response(JSON.stringify({}), { status: 404 }),
    );
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(api.defaults.baseURL).toBe('http://localhost:3000');
  });

  it('rejects discovered HTTP(S) base URLs when the API probe is not JSON', async () => {
    mockDiscoveryThenProbeResponse(
      'https://api.example.test',
      new Response('not json', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    );
    const { api, discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(discoverAndConfigureApiBaseUrl()).resolves.toBe('http://localhost:3000');

    expect(api.defaults.baseURL).toBe('http://localhost:3000');
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
    mockValidDiscoveryResponse('http://127.0.0.1:3001');
    const fetchMock = vi.mocked(fetch);
    const { discoverAndConfigureApiBaseUrl } = await importRuntimeApi();

    await expect(
      Promise.all([discoverAndConfigureApiBaseUrl(), discoverAndConfigureApiBaseUrl()]),
    ).resolves.toEqual(['http://127.0.0.1:3001', 'http://127.0.0.1:3001']);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
