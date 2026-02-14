import { request, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

const API_DISCOVERY_ROUTE = '/__api-base-url';
const API_SWAGGER_PATH = '/api-json';
const API_FALLBACK_PORT_START = 3000;
const API_FALLBACK_PORT_ATTEMPTS = 20;
const API_PROBE_TIMEOUT_MS = 400;
const API_DISCOVERY_CACHE_TTL_MS = 5000;
const API_HOST_CANDIDATES = ['localhost', '127.0.0.1'] as const;
// Важно: рядом могут работать чужие Swagger-серверы на localhost.
// Принимаем candidate API только если в схеме есть обязательные маршруты именно этого проекта.
const API_REQUIRED_PATHS = [
  '/auth/signin',
  '/admin/tests/public-links',
  '/tests/public/links/{code}',
] as const;

let cachedApiBaseUrl: string | null = null;
let cacheExpiresAt = 0;
// Инвариант: один активный discovery-проход на процесс,
// чтобы параллельные запросы к discovery-роуту не создавали шторм проверок по портам.
let inFlightApiDiscovery: Promise<string | null> | null = null;

const isSwaggerDocument = (payload: unknown): payload is Record<string, unknown> => {
  return (
    typeof payload === 'object' && payload !== null && ('openapi' in payload || 'swagger' in payload)
  );
};

const hasRequiredApiPaths = (payload: Record<string, unknown>) => {
  const paths = payload.paths;
  if (typeof paths !== 'object' || paths === null) {
    return false;
  }

  return API_REQUIRED_PATHS.every((path) => path in paths);
};

const probeApiHostPort = (host: string, port: number) =>
  new Promise<boolean>((resolve) => {
    const req = request(
      {
        host,
        port,
        method: 'GET',
        path: API_SWAGGER_PATH,
        timeout: API_PROBE_TIMEOUT_MS,
      },
      (response) => {
        let body = '';

        response.setEncoding('utf8');
        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          const statusCode = response.statusCode ?? 0;
          if (statusCode < 200 || statusCode >= 300) {
            resolve(false);
            return;
          }

          try {
            const parsedBody: unknown = JSON.parse(body);
            resolve(isSwaggerDocument(parsedBody) && hasRequiredApiPaths(parsedBody));
          } catch {
            resolve(false);
          }
        });
      },
    );

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });

const discoverApiBaseUrl = async () => {
  for (let offset = 0; offset < API_FALLBACK_PORT_ATTEMPTS; offset += 1) {
    const candidatePort = API_FALLBACK_PORT_START + offset;

    for (const candidateHost of API_HOST_CANDIDATES) {
      if (await probeApiHostPort(candidateHost, candidatePort)) {
        return `http://${candidateHost}:${candidatePort}`;
      }
    }
  }

  return null;
};

const discoverApiBaseUrlCached = async () => {
  if (Date.now() < cacheExpiresAt) {
    return cachedApiBaseUrl;
  }

  if (inFlightApiDiscovery) {
    return inFlightApiDiscovery;
  }

  inFlightApiDiscovery = discoverApiBaseUrl()
    .then((baseUrl) => {
      cachedApiBaseUrl = baseUrl;
      cacheExpiresAt = Date.now() + API_DISCOVERY_CACHE_TTL_MS;
      return baseUrl;
    })
    .finally(() => {
      inFlightApiDiscovery = null;
    });

  return inFlightApiDiscovery;
};

type MiddlewareNext = (error?: unknown) => void;

const apiDiscoveryMiddleware = (
  req: IncomingMessage & { url?: string; method?: string },
  res: ServerResponse<IncomingMessage>,
  next: MiddlewareNext,
) => {
  if (!req.url || !req.url.startsWith(API_DISCOVERY_ROUTE)) {
    next();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end();
    return;
  }

  void discoverApiBaseUrlCached()
    .then((baseUrl) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ baseUrl }));
    })
    .catch(() => {
      // Ограничение bootstrap-потока: discovery должен деградировать в `null`,
      // а не падать ошибкой, чтобы клиент мог продолжить запуск с fallback-логикой.
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(JSON.stringify({ baseUrl: null }));
    });
};

const runtimeApiDiscoveryPlugin = (): Plugin => ({
  name: 'runtime-api-discovery',
  configureServer(server) {
    server.middlewares.use(apiDiscoveryMiddleware);
  },
  configurePreviewServer(server) {
    server.middlewares.use(apiDiscoveryMiddleware);
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), runtimeApiDiscoveryPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
