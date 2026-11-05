import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LOCAL_CORS_ALLOWED_ORIGINS } from './config/env';
import { setupApp } from './setup-app';
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
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('configures credentialed CORS with the resolved origin allowlist during bootstrap', () => {
    process.env.NODE_ENV = 'development';
    const { app, enableCors, set, useBodyParser, useGlobalFilters } = createAppMock();

    const swaggerDocument = setupApp(app);

    expect(useBodyParser).toHaveBeenCalledWith('json', { limit: '1mb' });
    // Лимит start/finish (#124) считает адрес ученика, а не nginx.
    expect(set).toHaveBeenCalledWith('trust proxy', 1);
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(setupSwagger).toHaveBeenCalledWith(app, { publish: true });
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: LOCAL_CORS_ALLOWED_ORIGINS,
    });
    expect(swaggerDocument).toEqual({ mocked: 'swagger-document' });
  });

  it('builds the OpenAPI document but does not publish Swagger in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.CORS_ALLOWED_ORIGINS = 'https://app.example.com';
    const { app, enableCors } = createAppMock();

    expect(setupApp(app)).toEqual({ mocked: 'swagger-document' });
    expect(setupSwagger).toHaveBeenCalledWith(app, { publish: false });
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: ['https://app.example.com'],
    });
  });

  it('resolves the CORS allowlist before configuring bootstrap concerns', () => {
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
  const useBodyParser = jest.fn();
  const set = jest.fn();
  const app = {
    // Без `validate` ConfigService читает process.env, как и в приложении без проверенной схемы.
    get: jest.fn(() => new ConfigService()),
    enableCors,
    set,
    useBodyParser,
    useGlobalFilters,
  } as unknown as INestApplication;

  return { app, enableCors, set, useBodyParser, useGlobalFilters };
};
