import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testEmail = `auth-e2e-${Date.now()}@example.com`;
  const testPassword = 'Password123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
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
    expect(typeof response.body.refreshToken).toBe('string');
  });

  it('POST /auth/signin should login existing user and return auth tokens', async () => {
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
    expect(typeof response.body.refreshToken).toBe('string');
  });
});
