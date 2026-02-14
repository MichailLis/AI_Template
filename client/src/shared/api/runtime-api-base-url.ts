import api, { configureApiBaseUrl } from './api';

const API_DISCOVERY_ENDPOINT = '/__api-base-url';

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
    if (typeof payload.baseUrl === 'string' && isHttpUrl(payload.baseUrl)) {
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
