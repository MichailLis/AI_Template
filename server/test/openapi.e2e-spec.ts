import { INestApplication } from '@nestjs/common';
import type { OpenAPIObject } from '@nestjs/swagger';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

describe('OpenAPI contract (e2e)', () => {
  let app: INestApplication;
  let document: OpenAPIObject;
  let previousSkipDbConnect: string | undefined;

  beforeAll(async () => {
    previousSkipDbConnect = process.env.SKIP_DB_CONNECT;
    process.env.SKIP_DB_CONNECT = 'true';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    document = setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (previousSkipDbConnect === undefined) {
      delete process.env.SKIP_DB_CONNECT;
      return;
    }

    process.env.SKIP_DB_CONNECT = previousSkipDbConnect;
  });

  it('documents normalized error responses for auth validation failures', () => {
    const signinOperation = document.paths?.['/auth/signin']?.post;
    const badRequestResponse = signinOperation?.responses?.['400'];

    expect(badRequestResponse).toBeDefined();
    expect(JSON.stringify(badRequestResponse)).toContain('ErrorResponseDto');
    expect(document.components?.schemas?.ErrorResponseDto).toBeDefined();
  });

  it('documents refresh response as tokens without user payload', () => {
    const refreshOperation = document.paths?.['/auth/refresh']?.post;
    const okResponse = refreshOperation?.responses?.['200'];
    const refreshSchema = document.components?.schemas?.RefreshResponseDto as
      | { properties?: Record<string, unknown> }
      | undefined;

    expect(okResponse).toBeDefined();
    expect(JSON.stringify(okResponse)).toContain('RefreshResponseDto');
    expect(JSON.stringify(okResponse)).not.toContain('AuthResponseDto');
    expect(refreshSchema).toBeDefined();
    expect(refreshSchema?.properties).toHaveProperty('accessToken');
    expect(refreshSchema?.properties).toHaveProperty('refreshToken');
    expect(refreshSchema?.properties).not.toHaveProperty('user');
  });

  it('documents public test errors without protected-only statuses', () => {
    const getLinkOperation = document.paths?.['/tests/public/links/{code}']?.get;

    expect(getLinkOperation?.responses?.['400']).toBeDefined();
    expect(getLinkOperation?.responses?.['404']).toBeDefined();
    expect(getLinkOperation?.responses?.['401']).toBeUndefined();
    expect(getLinkOperation?.responses?.['403']).toBeUndefined();
    expect(JSON.stringify(getLinkOperation?.responses?.['400'])).toContain('ErrorResponseDto');
  });
});
