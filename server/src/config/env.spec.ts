import {
  LOCAL_CORS_ALLOWED_ORIGINS,
  isLocalRuntime,
  parsePort,
  resolveCorsAllowedOrigins,
  validateEnv,
} from './env';

const reader = (env: Record<string, string>) => (name: string) => env[name];

const SAFE_PRODUCTION_ENV = {
  NODE_ENV: 'production',
  CORS_ALLOWED_ORIGINS: 'https://app.example.com',
  DATABASE_URL: 'postgresql://app_user:strong_password@postgres:5432/app_db?schema=public',
  JWT_ACCESS_SECRET: 'real-access-secret',
  JWT_REFRESH_SECRET: 'real-refresh-secret',
};

describe('resolveCorsAllowedOrigins', () => {
  it('uses localhost origins for local development when no explicit origins are configured', () => {
    expect(resolveCorsAllowedOrigins(reader({ NODE_ENV: 'development' }))).toEqual(
      LOCAL_CORS_ALLOWED_ORIGINS,
    );
  });

  it('parses explicit origins from comma-separated configuration', () => {
    expect(
      resolveCorsAllowedOrigins(
        reader({
          CORS_ALLOWED_ORIGINS:
            ' https://admin.example.com, http://localhost:5173/ ,https://app.example.com ',
        }),
      ),
    ).toEqual(['https://admin.example.com', 'http://localhost:5173', 'https://app.example.com']);
  });

  it('requires explicit origins outside local development', () => {
    expect(() => resolveCorsAllowedOrigins(reader({ NODE_ENV: 'production' }))).toThrow(
      'CORS_ALLOWED_ORIGINS is required outside local development',
    );
  });

  it('rejects wildcard origins', () => {
    expect(() =>
      resolveCorsAllowedOrigins(reader({ CORS_ALLOWED_ORIGINS: 'https://admin.example.com,*' })),
    ).toThrow('CORS_ALLOWED_ORIGINS must list explicit HTTP(S) origins');
  });

  it('rejects non-http origins', () => {
    expect(() =>
      resolveCorsAllowedOrigins(reader({ CORS_ALLOWED_ORIGINS: 'ftp://files.example.com' })),
    ).toThrow('CORS_ALLOWED_ORIGINS must list explicit HTTP(S) origins');
  });
});

describe('isLocalRuntime', () => {
  it.each([undefined, '', ' development ', 'test'])('treats NODE_ENV=%p as local', (nodeEnv) => {
    expect(isLocalRuntime(() => nodeEnv)).toBe(true);
  });

  it.each(['production', 'staging'])('treats NODE_ENV=%p as non-local', (nodeEnv) => {
    expect(isLocalRuntime(() => nodeEnv)).toBe(false);
  });
});

describe('parsePort', () => {
  it('falls back to 3000 for an empty value', () => {
    expect(parsePort(undefined)).toBe(3000);
    expect(parsePort('')).toBe(3000);
  });

  it('parses a valid port', () => {
    expect(parsePort('8080')).toBe(8080);
  });

  it.each(['0', '65536', 'abc', '-1'])('rejects %p', (value) => {
    expect(() => parsePort(value)).toThrow(`Invalid PORT value: "${value}"`);
  });
});

describe('validateEnv', () => {
  it('accepts an empty local environment and returns the configuration as it is', () => {
    const config = { NODE_ENV: 'development', AI_TIMEOUT_MS: '' };

    expect(validateEnv(config)).toBe(config);
  });

  it('keeps variables the schema does not list', () => {
    const config = { ...SAFE_PRODUCTION_ENV, BACKUP_DIR: '/backups', CUSTOM: 'x' };

    expect(validateEnv(config)).toEqual(config);
  });

  it.each([
    ['AI_TIMEOUT_MS', '90s'],
    ['BACKUP_MAX_UPLOAD_MB', '1G'],
    ['ANALYSIS_LLM_CONCURRENCY', 'many'],
    ['OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES', 'two'],
  ])('rejects %s=%s instead of silently using the default', (name, value) => {
    expect(() => validateEnv({ [name]: value })).toThrow(
      `${name} must be a number or empty; received "${value}"`,
    );
  });

  it.each(['', '  ', '0', '120000', '1.5'])('accepts the numeric value %p', (value) => {
    expect(() => validateEnv({ AI_TIMEOUT_MS: value, BACKUP_MAX_COUNT: value })).not.toThrow();
  });

  it('rejects an invalid PORT', () => {
    expect(() => validateEnv({ PORT: '99999' })).toThrow('Invalid PORT value: "99999"');
  });

  it('reports every problem at once', () => {
    expect(() => validateEnv({ AI_TIMEOUT_MS: '90s', BACKUP_MAX_UPLOAD_MB: '1G' })).toThrow(
      /AI_TIMEOUT_MS[\s\S]*BACKUP_MAX_UPLOAD_MB/,
    );
  });

  it('requires explicit CORS origins outside local development', () => {
    expect(() => validateEnv({ ...SAFE_PRODUCTION_ENV, CORS_ALLOWED_ORIGINS: '' })).toThrow(
      'CORS_ALLOWED_ORIGINS is required outside local development',
    );
  });

  it('rejects local JWT and database placeholders outside local development', () => {
    expect(() =>
      validateEnv({
        ...SAFE_PRODUCTION_ENV,
        DATABASE_URL: 'postgresql://user:password@postgres:5432/my_app_db?schema=public',
        JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
        JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
      }),
    ).toThrow(
      'Non-local runtime configuration contains unsafe placeholder values: DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET.',
    );
  });

  it('rejects missing secrets outside local development', () => {
    expect(() => validateEnv({ ...SAFE_PRODUCTION_ENV, JWT_REFRESH_SECRET: undefined })).toThrow(
      'unsafe placeholder values: JWT_REFRESH_SECRET',
    );
  });

  it('allows non-local secrets with dev prefixes when they are not template placeholders', () => {
    expect(() =>
      validateEnv({
        ...SAFE_PRODUCTION_ENV,
        JWT_ACCESS_SECRET: 'dev-prefixed-real-access-secret',
        JWT_REFRESH_SECRET: 'dev-prefixed-real-refresh-secret',
      }),
    ).not.toThrow();
  });

  it('allows local placeholders during local development', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:password@postgres:5432/my_app_db?schema=public',
        JWT_ACCESS_SECRET: 'dev-access-secret-change-me',
        JWT_REFRESH_SECRET: 'dev-refresh-secret-change-me',
      }),
    ).not.toThrow();
  });
});
