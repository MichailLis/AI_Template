import { BadGatewayException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';
import request from 'supertest';

import { AiProviderConfigService } from '../src/ai-provider/ai-provider-config.service';
import { AiProviderClientService } from '../src/ai-provider/ai-provider.client';
import { TEST_AI_PROVIDER_CONNECTION } from '../src/ai-provider/spec-fixtures';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { findFailedAttemptIds } from '../src/tests/analysis/analysis-restart';
import { TestsAnalysisService } from '../src/tests/analysis/analysis.service';
import { createE2eUser } from './helpers/create-e2e-user';

jest.setTimeout(60_000);

const MINUTE = 60_000;

const validAnalysis = {
  introduction:
    'По результатам теста виден устойчивый интерес к практическим задачам и постепенному развитию профессиональных навыков.',
  skillsLevel: {
    title: 'Текущий уровень базовых навыков',
    summary: 'Навыки развиты на среднем уровне.',
    items: [
      { name: 'Коммуникация', level: 'medium', score: 68, description: 'Умеет объяснять решения.' },
    ],
  },
  thinkingType: {
    title: 'Тип мышления',
    type: 'Аналитический',
    description: 'Сначала ищет структуру.',
    strengths: ['структурность'],
  },
  personalityTraits: {
    title: 'Личностные особенности',
    traits: [
      {
        name: 'Самостоятельность',
        description: 'Берет ответственность за задачи.',
        careerImpact: 'Подходит для самостоятельных ролей.',
      },
    ],
  },
  careerDevelopment: {
    summary: 'Стоит развивать портфолио.',
    recommendedDirections: ['аналитика'],
    developmentRecommendations: ['делать мини-проекты'],
    professionalNextSteps: ['получить обратную связь'],
  },
};

const providerFailure = (status: number) =>
  new BadGatewayException('Неверные учётные данные авторизации', {
    cause: OpenAI.APIError.generate(status, { error: { message: 'x' } }, 'x', new Headers()),
    description: 'AI_PROVIDER_REQUEST_FAILED',
  });

describe('Restart of a failed AI analysis (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let analysisService: TestsAnalysisService;
  let adminToken = '';
  let userToken = '';
  let linkId = 0;
  let topicVersionId = 0;
  let promptVersionId = 0;
  let seeded = 0;
  // Fails by default, like a revoked key; tests that need the provider back swap the implementation.
  const aiClient = {
    fetchModels: jest.fn().mockRejectedValue(new Error('no catalog')),
    generatePrompt: jest.fn(),
  };

  const suffix = Date.now();
  const adminEmail = `analysis-restart-admin-e2e-${suffix}@example.com`;
  const userEmail = `analysis-restart-user-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const slugPrefix = `analysis-restart-e2e-${suffix}`;
  const shortCode = `AR${suffix}`.slice(0, 16).toUpperCase();

  const auth = (token = adminToken) => ({ Authorization: `Bearer ${token}` });

  const signin = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);

    return response.body.accessToken as string;
  };

  const cleanup = async () => {
    await prisma.auditEvent.deleteMany({
      where: {
        entityType: 'PUBLIC_LINK',
        entityId: String(linkId),
        action: { endsWith: 'RESTARTED' },
      },
    });
    await prisma.testPublicLink.deleteMany({ where: { shortCode } });
    await prisma.testTopic.deleteMany({ where: { slug: { startsWith: slugPrefix } } });
    await prisma.analysisPrompt.deleteMany({ where: { title: { startsWith: slugPrefix } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
  };

  /** A finished attempt whose analysis row is whatever the test needs to find in the database. */
  const seedAttempt = async (analysis: {
    status: 'PENDING' | 'READY' | 'FAILED';
    providerMode: 'LLM' | 'ALGORITHM_LLM';
    summary: unknown;
  }) => {
    seeded += 1;
    const attempt = await prisma.testStudentAttempt.create({
      data: {
        publicLinkId: linkId,
        topicVersionId,
        attemptNumber: 1,
        status: 'COMPLETED',
        studentName: `Ученик ${seeded}`,
        studentKeyHash: `restart-e2e-${suffix}-${seeded}`,
        consentAcceptedAt: new Date(),
        consentVersion: 'v1',
        consentTextSnapshot: 'Согласие для e2e.',
        resumeToken: `restart-e2e-${suffix}-${seeded}`,
        finishedAt: new Date(),
        analysis: {
          create: {
            promptVersionId,
            providerMode: analysis.providerMode,
            status: analysis.status,
            summary:
              analysis.summary === null
                ? Prisma.JsonNull
                : (analysis.summary as Prisma.InputJsonValue),
            errorMessage:
              analysis.status === 'FAILED' ? 'Неверные учётные данные авторизации' : null,
          },
        },
      },
      select: { id: true },
    });

    return attempt.id;
  };

  const seedFailed = (summary: unknown = { llm: { reason: 'AUTH', autoRetries: 0 } }) =>
    seedAttempt({ status: 'FAILED', providerMode: 'LLM', summary });

  const analysisOf = (attemptId: number) =>
    prisma.testStudentAnalysis.findUniqueOrThrow({ where: { attemptId } });

  const waitForStatus = async (attemptId: number, status: string) => {
    const deadline = Date.now() + 10_000;

    while (Date.now() < deadline) {
      const analysis = await analysisOf(attemptId);

      if (analysis.status === status) {
        return analysis;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    throw new Error(`Analysis of attempt ${attemptId} never became ${status}`);
  };

  const restartOne = (attemptId: number, token = adminToken) =>
    request(app.getHttpServer())
      .post(`/admin/tests/attempts/${attemptId}/analysis/restart`)
      .set(auth(token));

  const restartAll = (token = adminToken) =>
    request(app.getHttpServer())
      .post(`/admin/tests/public-links/${linkId}/attempts/analysis/restart-failed`)
      .set(auth(token));

  const auditedRestarts = (action: string) =>
    prisma.auditEvent.findMany({
      where: { entityType: 'PUBLIC_LINK', entityId: String(linkId), action },
      select: { changes: true, actorUserId: true },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiProviderClientService)
      .useValue(aiClient)
      .overrideProvider(AiProviderConfigService)
      .useValue({ getConnection: jest.fn().mockResolvedValue(TEST_AI_PROVIDER_CONNECTION) })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    analysisService = app.get(TestsAnalysisService);

    await cleanup();
    await createE2eUser(prisma, {
      email: adminEmail,
      password,
      name: 'Restart Admin',
      role: 'ADMIN',
    });
    await createE2eUser(prisma, { email: userEmail, password, name: 'Restart User' });
    adminToken = await signin(adminEmail);
    userToken = await signin(userEmail);

    const prompt = await prisma.analysisPrompt.create({
      data: {
        title: `${slugPrefix}-prompt`,
        versions: {
          create: {
            versionNumber: 1,
            status: 'PUBLISHED',
            model: 'google/gemini-2.0-flash-exp:free',
            temperature: 0.2,
            prompt: 'Проанализируй ответы ученика',
            publishedAt: new Date(),
          },
        },
      },
      include: { versions: true },
    });
    promptVersionId = prompt.versions[0].id;

    // Seeded straight into the database: the API creates links in Serializable transactions, and
    // this suite runs next to others that do the same, so it must not add to their conflicts.
    const topic = await prisma.testTopic.create({ data: { slug: `${slugPrefix}-topic` } });
    const version = await prisma.testTopicVersion.create({
      data: {
        topicId: topic.id,
        versionNumber: 1,
        status: 'PUBLISHED',
        title: 'Перезапуск анализа',
        analysisPromptVersionId: promptVersionId,
      },
    });
    await prisma.testTopic.update({
      where: { id: topic.id },
      data: { activePublishedVersionId: version.id },
    });
    topicVersionId = version.id;
    const link = await prisma.testPublicLink.create({
      data: {
        topicVersionId,
        shortCode,
        maxAttemptsPerStudent: 3,
        consentVersion: 'v1',
        consentTextSnapshot: 'Согласие для e2e.',
      },
    });
    linkId = link.id;
  });

  beforeEach(() => {
    aiClient.generatePrompt.mockReset();
    aiClient.generatePrompt.mockRejectedValue(providerFailure(401));
  });

  afterEach(async () => {
    await prisma.testStudentAttempt.deleteMany({ where: { publicLinkId: linkId } });
    await prisma.auditEvent.deleteMany({
      where: {
        entityType: 'PUBLIC_LINK',
        entityId: String(linkId),
        action: { endsWith: 'RESTARTED' },
      },
    });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  it('records why the analysis failed, and gives no retry time for a revoked key', async () => {
    const attemptId = await seedAttempt({ status: 'PENDING', providerMode: 'LLM', summary: null });

    await analysisService.runAttemptAnalysis(attemptId);

    const analysis = await analysisOf(attemptId);
    expect(analysis.status).toBe('FAILED');
    expect(analysis.summary).toMatchObject({
      llm: { reason: 'AUTH', httpStatus: 401, autoRetries: 0 },
    });
    expect(analysis.summary).not.toHaveProperty('llm.nextRetryAtMs');
  });

  it('schedules the first automatic retry ten minutes after a provider outage', async () => {
    aiClient.generatePrompt.mockRejectedValue(providerFailure(503));
    const attemptId = await seedAttempt({ status: 'PENDING', providerMode: 'LLM', summary: null });
    const before = Date.now();

    await analysisService.runAttemptAnalysis(attemptId);

    const llm = (await analysisOf(attemptId)).summary as { llm: { nextRetryAtMs: number } };
    expect(llm.llm.nextRetryAtMs).toBeGreaterThanOrEqual(before + 10 * MINUTE);
    expect(llm.llm.nextRetryAtMs).toBeLessThan(Date.now() + 10 * MINUTE + 1);
  });

  it('shows the admin which analyses can be restarted', async () => {
    const failedId = await seedFailed();
    await seedAttempt({ status: 'READY', providerMode: 'LLM', summary: validAnalysis });
    await seedAttempt({ status: 'PENDING', providerMode: 'LLM', summary: null });

    const detail = await request(app.getHttpServer())
      .get(`/admin/tests/attempts/${failedId}`)
      .set(auth())
      .expect(200);
    const list = await request(app.getHttpServer())
      .get(`/admin/tests/public-links/${linkId}/attempts`)
      .query({ limit: 1 })
      .set(auth())
      .expect(200);

    expect(detail.body.analysis).toMatchObject({ resultKind: 'FAILED', canRestart: true });
    // The count covers the whole link, whatever page and filter the table shows.
    expect(list.body.failedAnalysisCount).toBe(1);
  });

  it('restarts a failed analysis once however many times the button is pressed', async () => {
    const attemptId = await seedFailed();
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    aiClient.generatePrompt.mockImplementation(async () => {
      await gate;
      return { model: 'm', output: JSON.stringify(validAnalysis) };
    });

    const responses = await Promise.all([
      restartOne(attemptId),
      restartOne(attemptId),
      restartOne(attemptId),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(responses.filter((response) => response.body.restarted === true)).toHaveLength(1);
    expect((await analysisOf(attemptId)).status).toBe('PENDING');

    // Pressed again while the analysis is running: nothing to restart.
    const whileRunning = await restartOne(attemptId).expect(200);
    expect(whileRunning.body).toEqual({ attemptId, restarted: false });

    release();
    const done = await waitForStatus(attemptId, 'READY');

    expect(aiClient.generatePrompt).toHaveBeenCalledTimes(1);
    expect(done.summary).toMatchObject({ introduction: validAnalysis.introduction });
    expect((await restartOne(attemptId).expect(200)).body.restarted).toBe(false);
    expect(aiClient.generatePrompt).toHaveBeenCalledTimes(1);

    const events = await auditedRestarts('ANALYSIS_RESTARTED');
    expect(events).toHaveLength(1);
    expect(events[0].changes).toEqual([
      { field: 'attemptId', before: null, after: String(attemptId) },
    ]);
    expect(events[0].actorUserId).not.toBeNull();
  });

  it('fails again, and can be restarted again, when the provider is still down', async () => {
    const attemptId = await seedFailed();

    await restartOne(attemptId).expect(200);
    await waitForStatus(attemptId, 'FAILED');
    const second = await restartOne(attemptId).expect(200);

    expect(second.body.restarted).toBe(true);
    await waitForStatus(attemptId, 'FAILED');
    expect(aiClient.generatePrompt).toHaveBeenCalledTimes(2);
  });

  it('restarts every failed analysis of the link in one go and leaves the rest alone', async () => {
    const failed = [await seedFailed(), await seedFailed(), await seedFailed()];
    const readyId = await seedAttempt({
      status: 'READY',
      providerMode: 'LLM',
      summary: validAnalysis,
    });
    const pendingId = await seedAttempt({ status: 'PENDING', providerMode: 'LLM', summary: null });
    aiClient.generatePrompt.mockResolvedValue({
      model: 'm',
      output: JSON.stringify(validAnalysis),
    });

    const [first, second] = await Promise.all([restartAll(), restartAll()]);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(first.body.restarted + second.body.restarted).toBe(3);
    await Promise.all(failed.map((attemptId) => waitForStatus(attemptId, 'READY')));
    expect(aiClient.generatePrompt).toHaveBeenCalledTimes(3);
    expect((await analysisOf(pendingId)).status).toBe('PENDING');
    expect((await analysisOf(readyId)).status).toBe('READY');

    const events = await auditedRestarts('ANALYSES_RESTARTED');
    const audited = events.flatMap((event) =>
      (event.changes as Array<{ after: string }>).map((change) => Number(change.after)),
    );
    expect(audited.reduce((sum, count) => sum + count, 0)).toBe(3);

    const nothingLeft = await restartAll().expect(200);
    expect(nothingLeft.body).toEqual({ restarted: 0 });
    expect(await auditedRestarts('ANALYSES_RESTARTED')).toHaveLength(events.length);
  });

  it('restarts the enrichment of a two-phase result while its record stays READY', async () => {
    const summary = {
      resultKind: 'prof_orientation_v3_plus',
      atlas: { status: 'ready' },
      llm: { status: 'failed', model: 'm', errorMessage: 'x', reason: 'AUTH', autoRetries: 0 },
    };
    const attemptId = await seedAttempt({
      status: 'READY',
      providerMode: 'ALGORITHM_LLM',
      summary,
    });

    // The run itself is out of scope here: it would go to the real Atlas for a two-phase result.
    const enqueue = jest
      .spyOn(analysisService, 'enqueueAttemptAnalysis')
      .mockImplementation(() => undefined);
    const response = await restartOne(attemptId).expect(200);

    expect(response.body.restarted).toBe(true);
    expect(enqueue).toHaveBeenCalledWith(attemptId);
    enqueue.mockRestore();
    const analysis = await analysisOf(attemptId);
    expect(analysis.status).toBe('READY');
    expect(analysis.summary).toMatchObject({
      atlas: { status: 'ready' },
      llm: { status: 'pending' },
    });
    expect(analysis.summary).not.toHaveProperty('llm.reason');
    expect((await restartOne(attemptId).expect(200)).body.restarted).toBe(false);
  });

  describe('automatic retries against the real database', () => {
    const past = () => Date.now() - MINUTE;
    const future = () => Date.now() + 30 * MINUTE;

    it('picks only failures that are due, and only those a retry can help', async () => {
      const due = await seedFailed({
        llm: { reason: 'PROVIDER_ERROR', autoRetries: 0, nextRetryAtMs: past() },
      });
      const notYet = await seedFailed({
        llm: { reason: 'PROVIDER_ERROR', autoRetries: 1, nextRetryAtMs: future() },
      });
      const revokedKey = await seedFailed({ llm: { reason: 'AUTH', autoRetries: 0 } });
      const legacyFailure = await seedFailed(null);
      const dueEnrichment = await seedAttempt({
        status: 'READY',
        providerMode: 'ALGORITHM_LLM',
        summary: {
          resultKind: 'prof_orientation_v3_plus',
          llm: { status: 'failed', reason: 'TIMEOUT', autoRetries: 0, nextRetryAtMs: past() },
        },
      });
      await seedAttempt({
        status: 'READY',
        providerMode: 'ALGORITHM_LLM',
        summary: {
          resultKind: 'prof_orientation_v3_plus',
          llm: { status: 'ready', nextRetryAtMs: past() },
        },
      });
      await seedAttempt({
        status: 'PENDING',
        providerMode: 'LLM',
        summary: { llm: { nextRetryAtMs: past() } },
      });

      const ids = await findFailedAttemptIds(prisma, { linkId, retryDueAt: new Date(), take: 50 });
      const everyFailure = await findFailedAttemptIds(prisma, { linkId, take: 50 });

      expect(ids.sort()).toEqual([due, dueEnrichment].sort());
      expect(everyFailure.sort()).toEqual(
        [due, notYet, revokedKey, legacyFailure, dueEnrichment].sort(),
      );
    });

    it('retries a due failure once and counts the retry; a failure that is not due stays as it is', async () => {
      const due = await seedFailed({
        llm: { reason: 'PROVIDER_ERROR', autoRetries: 1, nextRetryAtMs: past() },
      });
      const notYet = await seedFailed({
        llm: { reason: 'PROVIDER_ERROR', autoRetries: 0, nextRetryAtMs: future() },
      });
      aiClient.generatePrompt.mockRejectedValue(providerFailure(503));

      await expect(analysisService.restartFailedAnalysis(notYet, new Date())).resolves.toBe(false);
      await expect(analysisService.restartFailedAnalysis(due, new Date())).resolves.toBe(true);
      await waitForStatus(due, 'FAILED');

      // The second automatic retry has been made and failed again: the pause is now the longest.
      const llm = (await analysisOf(due)).summary as {
        llm: { autoRetries: number; nextRetryAtMs: number };
      };
      expect(llm.llm.autoRetries).toBe(2);
      expect(llm.llm.nextRetryAtMs).toBeGreaterThan(Date.now() + 80 * MINUTE);
      expect((await analysisOf(notYet)).status).toBe('FAILED');
      expect(aiClient.generatePrompt).toHaveBeenCalledTimes(1);
    });
  });

  describe('access and errors', () => {
    it('answers 401 without a token and 403 to a user who is not an admin', async () => {
      const attemptId = await seedFailed();
      const calls = [
        () =>
          request(app.getHttpServer()).post(`/admin/tests/attempts/${attemptId}/analysis/restart`),
        () =>
          request(app.getHttpServer()).post(
            `/admin/tests/public-links/${linkId}/attempts/analysis/restart-failed`,
          ),
        () => request(app.getHttpServer()).post('/admin/settings/ai-provider/check'),
      ];

      for (const call of calls) {
        await call().expect(401);
        await call().set(auth(userToken)).expect(403);
      }

      expect((await analysisOf(attemptId)).status).toBe('FAILED');
      expect(aiClient.generatePrompt).not.toHaveBeenCalled();
    });

    it('answers 404 for an attempt or a link that does not exist', async () => {
      await restartOne(2_000_000_000).expect(404);
      await request(app.getHttpServer())
        .post('/admin/tests/public-links/2000000000/attempts/analysis/restart-failed')
        .set(auth())
        .expect(404);
    });
  });
});
