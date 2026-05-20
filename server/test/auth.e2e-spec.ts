import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const refreshCookieName = 'refreshToken';
  const testEmail = `auth-e2e-${Date.now()}@example.com`;
  const refreshEmail = `auth-refresh-e2e-${Date.now()}@example.com`;
  const testPassword = 'Password123';

  const getRefreshCookie = (response: request.Response) => {
    const setCookieHeader = response.headers['set-cookie'];
    const cookies = Array.isArray(setCookieHeader)
      ? setCookieHeader
      : setCookieHeader
        ? [setCookieHeader]
        : [];
    const refreshCookie = cookies.find((cookie) => cookie.startsWith(`${refreshCookieName}=`));

    expect(refreshCookie).toBeDefined();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('SameSite=Lax');

    return refreshCookie!.split(';')[0];
  };

  const signinRefreshUser = async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: refreshEmail,
        password: testPassword,
      })
      .expect(200);

    return {
      accessToken: response.body.accessToken as string,
      refreshCookie: getRefreshCookie(response),
    };
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: { in: [testEmail, refreshEmail] } } });

    await request(app.getHttpServer()).post('/auth/signup').send({
      email: refreshEmail,
      password: testPassword,
      name: 'Auth Refresh E2E User',
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [testEmail, refreshEmail] } } });
    await app.close();
  });

  it('POST /auth/signup should register user and return auth tokens', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: testPassword,
        name: 'Auth E2E User',
      })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email: testEmail,
      name: 'Auth E2E User',
    });
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.refreshToken).toBeUndefined();
    getRefreshCookie(response);
  });

  it('POST /auth/signin should login existing user and set an HttpOnly refresh cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: testEmail,
        password: testPassword,
      })
      .expect(200);

    expect(response.body.user).toMatchObject({
      email: testEmail,
      name: 'Auth E2E User',
    });
    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.refreshToken).toBeUndefined();
    getRefreshCookie(response);
  });

  it('POST /auth/signin should return normalized validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'not-an-email',
        password: '',
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
      },
      path: '/auth/signin',
    });
    expect(Array.isArray(response.body.error.details)).toBe(true);
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('POST /auth/refresh should rotate refresh tokens without user payload', async () => {
    const { refreshCookie } = await signinRefreshUser();

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    expect(typeof response.body.accessToken).toBe('string');
    expect(response.body.refreshToken).toBeUndefined();
    expect(response.body.user).toBeUndefined();
    getRefreshCookie(response);
  });

  it('POST /auth/refresh should reject refresh tokens sent through Authorization', async () => {
    const { refreshCookie } = await signinRefreshUser();
    const refreshToken = refreshCookie.split('=')[1];

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${refreshToken}`)
      .expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        statusCode: 401,
      },
      path: '/auth/refresh',
    });
  });

  it('POST /auth/refresh should reject a missing refresh cookie', async () => {
    const response = await request(app.getHttpServer()).post('/auth/refresh').expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        statusCode: 401,
      },
      path: '/auth/refresh',
    });
  });

  it('POST /auth/refresh should reject a reused refresh token after rotation', async () => {
    const { refreshCookie } = await signinRefreshUser();

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(200);

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        statusCode: 403,
        message: 'Access Denied',
      },
      path: '/auth/refresh',
    });
  });

  it('POST /auth/refresh should reject a refresh token invalidated by logout', async () => {
    const { accessToken, refreshCookie } = await signinRefreshUser();

    const logoutResponse = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const logoutSetCookieHeader = logoutResponse.headers['set-cookie'];
    const logoutCookies = Array.isArray(logoutSetCookieHeader)
      ? logoutSetCookieHeader
      : logoutSetCookieHeader
        ? [logoutSetCookieHeader]
        : [];

    expect(
      logoutCookies.some((cookie) => cookie.startsWith(`${refreshCookieName}=;`)),
    ).toBeTruthy();

    const response = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        statusCode: 403,
        message: 'Access Denied',
      },
      path: '/auth/refresh',
    });
  });
});
