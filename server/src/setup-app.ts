import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { setupSwagger } from './swagger';

const JSON_BODY_LIMIT = '1mb';
const LOCAL_NODE_ENVS = new Set(['', 'development', 'test']);
const CORS_ALLOWED_ORIGINS_ENV = 'CORS_ALLOWED_ORIGINS';
const LOCAL_DEV_PLACEHOLDER_VALUES = new Set([
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
]);

export const LOCAL_CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

const isLocalRuntime = () => LOCAL_NODE_ENVS.has(process.env.NODE_ENV?.trim() ?? '');

const normalizeCorsOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

const isHttpOrigin = (origin: string) => {
  try {
    const parsedUrl = new URL(origin);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

export const resolveCorsAllowedOrigins = () => {
  const configuredOrigins = process.env[CORS_ALLOWED_ORIGINS_ENV]?.trim();

  if (!configuredOrigins) {
    if (isLocalRuntime()) {
      return LOCAL_CORS_ALLOWED_ORIGINS;
    }

    throw new Error(`${CORS_ALLOWED_ORIGINS_ENV} is required outside local development.`);
  }

  const origins = configuredOrigins.split(',').map(normalizeCorsOrigin).filter(Boolean);

  if (
    origins.length === 0 ||
    origins.includes('*') ||
    origins.some((origin) => !isHttpOrigin(origin))
  ) {
    throw new Error(`${CORS_ALLOWED_ORIGINS_ENV} must list explicit HTTP(S) origins.`);
  }

  return origins;
};

const hasDefaultDatabaseCredentials = (databaseUrl: string) => {
  try {
    const parsedUrl = new URL(databaseUrl);
    return parsedUrl.username === 'user' && parsedUrl.password === 'password';
  } catch {
    return false;
  }
};

const isUnsafePlaceholderValue = (name: string, value: string | undefined) => {
  const normalizedValue = value?.trim().toLowerCase() ?? '';

  if (!normalizedValue) {
    return true;
  }

  if (normalizedValue.includes('change-me') || normalizedValue.includes('change-this')) {
    return true;
  }

  if (LOCAL_DEV_PLACEHOLDER_VALUES.has(normalizedValue)) {
    return true;
  }

  if (name === 'DATABASE_URL') {
    return hasDefaultDatabaseCredentials(normalizedValue);
  }

  return false;
};

export const validateRuntimeConfig = () => {
  if (isLocalRuntime()) {
    return;
  }

  resolveCorsAllowedOrigins();

  const unsafeVariables = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].filter(
    (name) => isUnsafePlaceholderValue(name, process.env[name]),
  );

  if (unsafeVariables.length > 0) {
    throw new Error(
      `Non-local runtime configuration contains unsafe placeholder values: ${unsafeVariables.join(
        ', ',
      )}.`,
    );
  }
};

export const setupApp = (app: INestApplication) => {
  validateRuntimeConfig();

  // Express default is 100kb; the settings prompt alone may be 160 000 chars (up to ~960kb escaped).
  (app as NestExpressApplication).useBodyParser('json', { limit: JSON_BODY_LIMIT });
  // Один прокси (nginx) перед бэкендом: req.ip берётся из X-Forwarded-For, иначе у всех учеников
  // был бы адрес nginx и лимит start/finish (#124) отсекал бы школу целиком.
  (app as NestExpressApplication).set('trust proxy', 1);
  app.useGlobalFilters(new AllExceptionsFilter());
  // Swagger UI and /api-json map every admin endpoint, so they stay local; gen:api still gets the document.
  const swaggerDocument = setupSwagger(app, { publish: isLocalRuntime() });
  app.enableCors({
    credentials: true,
    origin: resolveCorsAllowedOrigins(),
  });
  return swaggerDocument;
};
