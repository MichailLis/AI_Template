import type { INestApplication } from '@nestjs/common';

import {
  LOCAL_CORS_ALLOWED_ORIGINS,
  resolveCorsAllowedOrigins,
  setupApp,
  validateRuntimeConfig,
} from './setup-app';
import { setupSwagger } from './swagger';

jest.mock('./swagger', () => ({
  setupSwagger: jest.fn(() => ({ mocked: 'swagger-document' })),
}));

describe('setupApp runtime configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.mocked(setupSwagger).mockClear();
    process.env = { ...originalEnv };
    delete process.env.CORS_ALLOWED_ORIGINS;
    delete process.env.NODE_ENV;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_ACCESS_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('uses localhost CORS origins for local development when no explicit origins are configured', () => {
    process.env.NODE_ENV = 'development';

    expect(resolveCorsAllowedOrigins()).toEqual(LOCAL_CORS_ALLOWED_ORIGINS);
  });

  it('parses explicit CORS origins from comma-separated configuration', () => {
    process.env.CORS_ALLOWED_ORIGINS =
      ' https://admin.example.com, http://localhost:5173/ ,https://app.example.com ';

    expect(resolveCorsAllowedOrigins()).toEqual([
      'https://admin.example.com',
      'http://localhost:5173',
      'https://app.example.com',
    ]);
  });

  it('requires explicit CORS origins outside local development', () => {
    process.env.NODE_ENV = 'production';

    expect(() => resolveCorsAllowedOrigins()).toThrow(
      'CORS_ALLOWED_ORIGINS is required outside local development',
    );
  });

  it('rejects wildcard CORS origins', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'https://admin.example.com,*';

    expect(() => resolveCorsAllowedOrigins()).toThrow(
      'CORS_ALLOWED_ORIGINS must list explicit HTTP(S) origins',
    );
  });

  it('rejects non-http CORS origins', () => {
    process.env.CORS_ALLOWED_ORIGINS = 'ftp://files.example.com';

    expect(() => resolveCorsAllowedOrigins()).toThrow(
      'CORS_ALLOWED_ORIGINS must list explicit HTTP(S) origins',
    );
  });

  it('rejects local JWT and database placeholders outside local development', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    process.env.DATABASE_URL = 'postgresql://user:password@postgres:5432/my_app_db?schema=public';
    process.env.JWT_ACCESS_SECRET = 'dev-access-secret-change-me';
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me';

    expect(() => validateRuntimeConfig()).toThrow(
      'Non-local runtime configuration contains unsafe placeholder values',
    );
  });

  it('allows non-local secrets with dev prefixes when they are not template placeholders', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    process.env.DATABASE_URL =
      'postgresql://app_user:strong_password@postgres:5432/app_db?schema=public';
    process.env.JWT_ACCESS_SECRET = 'dev-prefixed-real-access-secret';
    process.env.JWT_REFRESH_SECRET = 'dev-prefixed-real-refresh-secret';

    expect(() => validateRuntimeConfig()).not.toThrow();
  });

  it('allows local placeholders during local development', () => {
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_URL = 'postgresql://user:password@postgres:5432/my_app_db?schema=public';
    process.env.JWT_ACCESS_SECRET = 'dev-access-secret-change-me';
    process.env.JWT_REFRESH_SECRET = 'dev-refresh-secret-change-me';

    expect(() => validateRuntimeConfig()).not.toThrow();
  });

  it('configures credentialed CORS with the resolved origin allowlist during bootstrap', () => {
    process.env.NODE_ENV = 'development';
    const { app, enableCors, useGlobalFilters } = createAppMock();

    const swaggerDocument = setupApp(app);

    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(setupSwagger).toHaveBeenCalledWith(app);
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: LOCAL_CORS_ALLOWED_ORIGINS,
    });
    expect(swaggerDocument).toEqual({ mocked: 'swagger-document' });
  });

  it('runs runtime validation before configuring bootstrap concerns', () => {
    process.env.NODE_ENV = 'production';
    const { app, enableCors, useGlobalFilters } = createAppMock();

    expect(() => setupApp(app)).toThrow(
      'CORS_ALLOWED_ORIGINS is required outside local development',
    );
    expect(useGlobalFilters).not.toHaveBeenCalled();
    expect(enableCors).not.toHaveBeenCalled();
    expect(setupSwagger).not.toHaveBeenCalled();
  });
});

const createAppMock = () => {
  const enableCors = jest.fn();
  const useGlobalFilters = jest.fn();
  const app = {
    enableCors,
    useGlobalFilters,
  } as unknown as INestApplication;

  return { app, enableCors, useGlobalFilters };
};
