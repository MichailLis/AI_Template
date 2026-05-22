import api, { configureApiBaseUrl } from './api';

const API_DISCOVERY_ENDPOINT = '/__api-base-url';
const API_SWAGGER_ENDPOINT = '/api-json';
const API_REQUIRED_PATHS = [
  '/auth/signin',
  '/admin/tests/public-links',
  '/tests/public/links/{code}',
] as const;

let inFlightDiscovery: Promise<string | null> | null = null;

const isHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

interface ApiDiscoveryResponse {
  baseUrl?: string | null;
}

const trimTrailingSlashes = (value: string) => {
  let lastCharacterIndex = value.length - 1;

  while (lastCharacterIndex >= 0 && value[lastCharacterIndex] === '/') {
    lastCharacterIndex -= 1;
  }

  return value.slice(0, lastCharacterIndex + 1);
};

const buildSwaggerProbeUrl = (baseUrl: string) => {
  return `${trimTrailingSlashes(baseUrl)}${API_SWAGGER_ENDPOINT}`;
};

const isProjectSwaggerDocument = (payload: unknown) => {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }

  if (!('openapi' in payload) && !('swagger' in payload)) {
    return false;
  }

  const paths = 'paths' in payload ? payload.paths : null;
  if (typeof paths !== 'object' || paths === null) {
    return false;
  }

  return API_REQUIRED_PATHS.every((path) => path in paths);
};

const isProjectApiBaseUrl = async (baseUrl: string) => {
  try {
    const response = await fetch(buildSwaggerProbeUrl(baseUrl), {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return false;
    }

    return isProjectSwaggerDocument(await response.json());
  } catch {
    return false;
  }
};

const discoverRuntimeApiBaseUrl = async () => {
  try {
    const response = await fetch(API_DISCOVERY_ENDPOINT, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ApiDiscoveryResponse;
    if (
      typeof payload.baseUrl === 'string' &&
      isHttpUrl(payload.baseUrl) &&
      (await isProjectApiBaseUrl(payload.baseUrl))
    ) {
      return payload.baseUrl;
    }

    return null;
  } catch {
    return null;
  }
};

export const discoverAndConfigureApiBaseUrl = async () => {
  if (typeof window === 'undefined') {
    return api.defaults.baseURL ?? null;
  }

  if (inFlightDiscovery) {
    return inFlightDiscovery;
  }

  inFlightDiscovery = (async () => {
    const discoveredBaseUrl = await discoverRuntimeApiBaseUrl();

    if (discoveredBaseUrl) {
      configureApiBaseUrl(discoveredBaseUrl);
    }

    return api.defaults.baseURL ?? discoveredBaseUrl;
  })().finally(() => {
    inFlightDiscovery = null;
  });

  return inFlightDiscovery;
};
