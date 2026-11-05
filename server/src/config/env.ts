import { z } from 'zod';

/**
 * Схема переменных окружения: единственное место, где они проверяются при старте
 * (`ConfigModule.forRoot({ validate })`). Читают их сервисы через `ConfigService`; значения по
 * умолчанию остаются там, где значение используется, и схема их не меняет: пустая переменная
 * считается незаданной, как и раньше.
 *
 * Схема отвергает то, что раньше молча заменялось значением по умолчанию: `AI_TIMEOUT_MS=90s`
 * или `BACKUP_MAX_UPLOAD_MB=1G` теперь останавливают запуск с понятным сообщением. Допустимые
 * диапазоны (`BACKUP_RETENTION_DAYS` 1–365 и т. п.) по-прежнему проверяет потребитель.
 *
 * `AI_PROVIDER` нарочно не в схеме: адрес и провайдер можно сохранить в админке, и тогда
 * опечатка в переменной не должна мешать запуску. Ее по-прежнему проверяет `AiProviderConfigService`.
 */

export type EnvReader = (name: string) => string | undefined;

export const DEFAULT_PORT = 3000;

const LOCAL_NODE_ENVS = new Set(['', 'development', 'test']);
const CORS_ALLOWED_ORIGINS_ENV = 'CORS_ALLOWED_ORIGINS';
const LOCAL_DEV_PLACEHOLDER_VALUES = new Set([
  'dev-access-secret-change-me',
  'dev-refresh-secret-change-me',
]);

export const LOCAL_CORS_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/** Переменные, которые потребители разбирают как число и при мусоре молча берут значение по умолчанию. */
const NUMERIC_ENV_NAMES = [
  'AI_TIMEOUT_MS',
  'OPENROUTER_TIMEOUT_MS',
  'AI_PROF_ORIENTATION_TIMEOUT_MS',
  'OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS',
  'AI_PROF_ORIENTATION_TIMEOUT_RETRIES',
  'OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES',
  'ANALYSIS_LLM_CONCURRENCY',
  'BACKUP_RETENTION_DAYS',
  'BACKUP_MAX_COUNT',
  'BACKUP_MAX_UPLOAD_MB',
  'BACKUP_TIMEOUT_MS',
] as const;

const SECRET_ENV_NAMES = ['DATABASE_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'] as const;

export const isLocalRuntime = (read: EnvReader) =>
  LOCAL_NODE_ENVS.has(read('NODE_ENV')?.trim() ?? '');

const normalizeCorsOrigin = (origin: string) => origin.trim().replace(/\/+$/, '');

const isHttpOrigin = (origin: string) => {
  try {
    const parsedUrl = new URL(origin);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
};

export const resolveCorsAllowedOrigins = (read: EnvReader) => {
  const configuredOrigins = read(CORS_ALLOWED_ORIGINS_ENV)?.trim();

  if (!configuredOrigins) {
    if (isLocalRuntime(read)) {
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

const toPort = (value: string) => {
  const port = Number.parseInt(value, 10);

  return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : null;
};

const invalidPortMessage = (value: string) =>
  `Invalid PORT value: "${value}". Expected integer in range 1-65535.`;

/** Порт в трактовке `parseInt`; пустое значение означает порт по умолчанию. */
export const parsePort = (value: string | undefined) => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = toPort(value);
  if (port === null) {
    throw new Error(invalidPortMessage(value));
  }

  return port;
};

const isBlank = (value: string | undefined) => value === undefined || value.trim() === '';

const numericVariable = (name: string) =>
  z
    .string()
    .optional()
    .refine((value) => isBlank(value) || Number.isFinite(Number(value)), {
      error: (issue) => `${name} must be a number or empty; received "${String(issue.input)}".`,
    });

const optionalString = z.string().optional();

export const envSchema = z
  .looseObject({
    NODE_ENV: optionalString,
    PORT: z
      .string()
      .optional()
      .refine((value) => !value || toPort(value) !== null, {
        error: (issue) => invalidPortMessage(String(issue.input)),
      }),
    SKIP_DB_CONNECT: optionalString,
    DATABASE_URL: optionalString,
    JWT_ACCESS_SECRET: optionalString,
    JWT_REFRESH_SECRET: optionalString,
    [CORS_ALLOWED_ORIGINS_ENV]: optionalString,
    ...Object.fromEntries(NUMERIC_ENV_NAMES.map((name) => [name, numericVariable(name)])),
  })
  .superRefine((env, context) => {
    const read: EnvReader = (name) => {
      const value = env[name];
      return typeof value === 'string' ? value : undefined;
    };

    if (isLocalRuntime(read)) {
      return;
    }

    try {
      resolveCorsAllowedOrigins(read);
    } catch (error) {
      context.addIssue({
        code: 'custom',
        path: [CORS_ALLOWED_ORIGINS_ENV],
        message: error instanceof Error ? error.message : String(error),
      });
    }

    const unsafeVariables = SECRET_ENV_NAMES.filter((name) =>
      isUnsafePlaceholderValue(name, read(name)),
    );

    if (unsafeVariables.length > 0) {
      context.addIssue({
        code: 'custom',
        message: `Non-local runtime configuration contains unsafe placeholder values: ${unsafeVariables.join(
          ', ',
        )}.`,
      });
    }
  });

/**
 * `validate` для `ConfigModule.forRoot`. Возвращает конфигурацию как есть: Nest кладет в
 * `process.env` значения из `.env`, а потребители продолжают читать строки через `ConfigService`.
 */
export const validateEnv = (config: Record<string, unknown>) => {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    throw new Error(
      `Invalid environment configuration:\n${result.error.issues
        .map((issue) => `- ${issue.message}`)
        .join('\n')}`,
    );
  }

  return config;
};
