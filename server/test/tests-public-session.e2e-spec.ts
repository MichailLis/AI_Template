import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';

describe('Tests public sessions (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;

  const suffix = Date.now();
  const runId = `${suffix.toString(36)}${randomUUID().replaceAll('-', '').slice(0, 8)}`;
  const adminEmail = `public-session-admin-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const testsSlugPrefix = `public-session-e2e-${suffix}`;
  const shortCodeBase = `P${runId}`.toUpperCase();

  const cleanupUsers = async () => {
    await prisma.user.deleteMany({
      where: {
        email: adminEmail,
      },
    });
  };

  const cleanupTestTopics = async () => {
    await prisma.testTopic.deleteMany({
      where: {
        slug: {
          startsWith: testsSlugPrefix,
        },
      },
    });
  };

  const cleanupPublicLinks = async () => {
    await prisma.testPublicLink.deleteMany({
      where: {
        shortCode: {
          startsWith: shortCodeBase,
        },
      },
    });
  };

  const signin = async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: adminEmail,
        password,
      })
      .expect(200);

    return response.body.accessToken as string;
  };

  const makeShortCode = (label: string) => `${shortCodeBase}${label}`.toUpperCase();

  const createPublishedTopicWithPublicLink = async (
    label: string,
    linkOverrides: Record<string, unknown> = {},
  ) => {
    const topicSlug = `${testsSlugPrefix}-${label.toLowerCase()}`;
    const shortCode = makeShortCode(label);

    const createTopicResponse = await request(app.getHttpServer())
      .post('/admin/tests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: `Публичный e2e тест ${label}`,
        slug: topicSlug,
        description: 'Проверка публичного прохождения теста',
      })
      .expect(201);

    const topicId = createTopicResponse.body.topicId as number;

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/draft/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'OPEN_TEXT',
        title: 'Опишите ваш опыт обучения',
        description: null,
        required: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const topicResponse = await request(app.getHttpServer())
      .get(`/admin/tests/${topicId}/draft`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const publishedVersionId = topicResponse.body.published.id as number;

    await request(app.getHttpServer())
      .post('/admin/tests/public-links')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        publishedVersionId,
        shortCode,
        maxAttemptsPerStudent: 3,
        timeLimitMinutes: null,
        allowResume: true,
        consentVersion: 'v1',
        consentText: 'Я согласен на обработку ответов в рамках e2e теста.',
        ...linkOverrides,
      })
      .expect(201);

    return {
      shortCode,
      topicId,
      publishedVersionId,
    };
  };

  const startPublicSession = async (shortCode: string, groupOrClass = 'ИС-21') => {
    return request(app.getHttpServer())
      .post(`/tests/public/links/${shortCode}/start`)
      .send({
        studentName: 'Иван',
        studentLastInitial: 'И',
        studentMiddleInitial: 'О',
        educationOrganization: 'Лицей 42',
        groupOrClass,
        consentAccepted: true,
      })
      .expect(201);
  };

  const expireSession = async (sessionToken: string) => {
    const attempt = await prisma.testStudentAttempt.findUniqueOrThrow({
      where: {
        resumeToken: sessionToken,
      },
      select: {
        id: true,
        status: true,
        finishedAt: true,
      },
    });

    expect(attempt.status).toBe('IN_PROGRESS');
    expect(attempt.finishedAt).toBeNull();

    await prisma.testStudentAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    return attempt;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupPublicLinks();
    await cleanupTestTopics();
    await cleanupUsers();

    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: adminEmail,
        password,
        name: 'Public Session Admin E2E',
      })
      .expect(201);

    await prisma.user.update({
      where: { id: signupResponse.body.user.id as number },
      data: { role: 'ADMIN' },
    });

    adminToken = await signin();
  });

  afterAll(async () => {
    await cleanupPublicLinks();
    await cleanupTestTopics();
    await cleanupUsers();
    await app.close();
  });

  it('supports public link metadata, session lifecycle, answers, finish, and result', async () => {
    const { shortCode } = await createPublishedTopicWithPublicLink('MAIN');

    const linkResponse = await request(app.getHttpServer())
      .get(`/tests/public/links/${shortCode}`)
      .expect(200);

    expect(linkResponse.body).toMatchObject({
      shortCode,
      title: 'Публичный e2e тест MAIN',
      questionCount: 1,
      maxAttemptsPerStudent: 3,
      timeLimitMinutes: null,
      allowResume: true,
      consentVersion: 'v1',
      consentText: 'Я согласен на обработку ответов в рамках e2e теста.',
    });

    const startResponse = await startPublicSession(shortCode);
    const sessionToken = startResponse.body.session.sessionToken as string;
    const questionId = startResponse.body.session.questions[0].id as number;

    expect(sessionToken).toEqual(expect.any(String));
    expect(startResponse.body.session).toMatchObject({
      shortCode,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      timeLimitMinutes: null,
    });
    expect(startResponse.body.session.questions).toHaveLength(1);

    const sessionResponse = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}`)
      .expect(200);

    expect(sessionResponse.body.session).toMatchObject({
      sessionToken,
      status: 'IN_PROGRESS',
    });
    expect(sessionResponse.body.session.questions[0]).toMatchObject({
      id: questionId,
      type: 'OPEN_TEXT',
      title: 'Опишите ваш опыт обучения',
    });

    const answersResponse = await request(app.getHttpServer())
      .put(`/tests/public/sessions/${sessionToken}/answers`)
      .send({
        answers: [
          {
            questionId,
            answerPayload: 'Занятия помогли лучше структурировать практику.',
          },
        ],
      })
      .expect(200);

    expect(answersResponse.body).toMatchObject({
      sessionToken,
      status: 'IN_PROGRESS',
    });
    expect(answersResponse.body.answers).toHaveLength(1);
    expect(answersResponse.body.answers[0]).toMatchObject({
      questionId,
      answerPayload: 'Занятия помогли лучше структурировать практику.',
    });

    const finishResponse = await request(app.getHttpServer())
      .post(`/tests/public/sessions/${sessionToken}/finish`)
      .expect(200);

    expect(finishResponse.body).toMatchObject({
      sessionToken,
      status: 'COMPLETED',
      finishedAt: expect.any(String),
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
        errorMessage: null,
      },
    });
    expect(finishResponse.body.analysis).not.toHaveProperty('rawText');

    const resultResponse = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);

    expect(resultResponse.body).toMatchObject({
      sessionToken,
      status: 'COMPLETED',
      finishedAt: expect.any(String),
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
      },
    });
    expect(resultResponse.body.analysis).not.toHaveProperty('rawText');
  });

  it('keeps an existing public link accessible after republishing its topic', async () => {
    const { shortCode, topicId, publishedVersionId } =
      await createPublishedTopicWithPublicLink('REPB');

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const linkVersion = await prisma.testTopicVersion.findUniqueOrThrow({
      where: { id: publishedVersionId },
      select: { status: true },
    });

    expect(linkVersion.status).toBe('ARCHIVED');

    const linkResponse = await request(app.getHttpServer())
      .get(`/tests/public/links/${shortCode}`)
      .expect(200);

    expect(linkResponse.body).toMatchObject({
      shortCode,
      title: 'Публичный e2e тест REPB',
      questionCount: 1,
    });
  });

  it('returns normalized errors for invalid public code and session token', async () => {
    const unknownCode = makeShortCode('MISS');

    const codeResponse = await request(app.getHttpServer())
      .get(`/tests/public/links/${unknownCode}`)
      .expect(404);

    expect(codeResponse.body).toMatchObject({
      success: false,
      error: {
        statusCode: 404,
        code: expect.any(String),
        message: expect.any(String),
        details: [],
      },
      path: `/tests/public/links/${unknownCode}`,
    });
    expect(codeResponse.body.timestamp).toEqual(expect.any(String));

    const tokenResponse = await request(app.getHttpServer())
      .get('/tests/public/sessions/not-a-real-token')
      .expect(404);

    expect(tokenResponse.body).toMatchObject({
      success: false,
      error: {
        statusCode: 404,
        code: expect.any(String),
        message: expect.any(String),
        details: [],
      },
      path: '/tests/public/sessions/not-a-real-token',
    });
    expect(tokenResponse.body.timestamp).toEqual(expect.any(String));
  });

  it('reports an expired session on read without mutating attempt status', async () => {
    const { shortCode } = await createPublishedTopicWithPublicLink('EXPR', {
      timeLimitMinutes: 1,
    });
    const startResponse = await startPublicSession(shortCode, 'ИС-22');
    const sessionToken = startResponse.body.session.sessionToken as string;

    const attempt = await expireSession(sessionToken);

    const sessionResponse = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}`)
      .expect(200);

    expect(sessionResponse.body.session).toMatchObject({
      sessionToken,
      status: 'EXPIRED',
    });

    const unchangedAttempt = await prisma.testStudentAttempt.findUniqueOrThrow({
      where: {
        id: attempt.id,
      },
      select: {
        status: true,
        finishedAt: true,
      },
    });

    expect(unchangedAttempt.status).toBe('IN_PROGRESS');
    expect(unchangedAttempt.finishedAt).toBeNull();
  });

  it('rejects finishing an expired session without mutating attempt status', async () => {
    const { shortCode } = await createPublishedTopicWithPublicLink('FEXP', {
      timeLimitMinutes: 1,
    });
    const startResponse = await startPublicSession(shortCode, 'ИС-23');
    const sessionToken = startResponse.body.session.sessionToken as string;
    const attempt = await expireSession(sessionToken);

    const finishResponse = await request(app.getHttpServer())
      .post(`/tests/public/sessions/${sessionToken}/finish`)
      .expect(400);

    expect(finishResponse.body).toMatchObject({
      success: false,
      error: {
        statusCode: 400,
        code: expect.any(String),
        message: expect.any(String),
        details: [],
      },
      path: `/tests/public/sessions/${sessionToken}/finish`,
    });

    const unchangedAttempt = await prisma.testStudentAttempt.findUniqueOrThrow({
      where: {
        id: attempt.id,
      },
      select: {
        status: true,
        finishedAt: true,
      },
    });

    expect(unchangedAttempt.status).toBe('IN_PROGRESS');
    expect(unchangedAttempt.finishedAt).toBeNull();
  });
});
