import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { setupApp } from '../src/setup-app';

describe('JSON body limit (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const signin = (password: string) =>
    request(app.getHttpServer()).post('/auth/signin').send({ email: 'a@example.com', password });

  it('answers an oversized JSON body with 413 in the canonical error shape', async () => {
    const response = await signin('x'.repeat(1_200_000));

    expect(response.status).toBe(413);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('entity.too.large');
  });

  it('accepts a body above the Express 100kb default but within the limit', async () => {
    const response = await signin('x'.repeat(300_000));

    // the body reaches the controller (any app-level 4xx), the parser does not cut it off
    expect(response.status).not.toBe(413);
    expect(response.body.error.code).not.toBe('entity.too.large');
  });

  it('keeps 400 for malformed JSON', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .set('Content-Type', 'application/json')
      .send('{"email": ');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
