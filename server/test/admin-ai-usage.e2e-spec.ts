import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AiProviderConfigService } from '../src/ai-provider/ai-provider-config.service';
import { AiProviderClientService } from '../src/ai-provider/ai-provider.client';
import { TEST_AI_PROVIDER_CONNECTION } from '../src/ai-provider/spec-fixtures';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

jest.setTimeout(60_000);

const DAY = 24 * 60 * 60 * 1000;

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

const completionBody = (model: string, usage: Record<string, number>) => ({
  id: 'cmpl-e2e',
  object: 'chat.completion',
  created: 0,
  model,
  usage,
  choices: [
    { index: 0, finish_reason: 'stop', message: { role: 'assistant', content: '{"ok":true}' } },
  ],
});

describe('AI usage accounting (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let client: AiProviderClientService;
  let adminToken = '';
  let userToken = '';
  let adminId = 0;
  let attemptId = 0;

  const suffix = Date.now();
  const adminEmail = `ai-usage-admin-e2e-${suffix}@example.com`;
  const userEmail = `ai-usage-user-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const slugPrefix = `ai-usage-e2e-${suffix}`;
  const shortCode = `AU${suffix}`.slice(0, 16).toUpperCase();
  // Other suites write to the same table, so every assertion looks only at this suite's models.
  const model = `${slugPrefix}/model`;
  const otherModel = `${slugPrefix}/other`;

  const auth = (token = adminToken) => ({ Authorization: `Bearer ${token}` });

  const signin = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);

    return response.body.accessToken as string;
  };

  const ownEvents = () =>
    prisma.aiUsageEvent.findMany({
      where: { requestedModel: { startsWith: slugPrefix } },
      orderBy: { id: 'asc' },
    });

  const summaryFrom = (from: Date, token = adminToken) =>
    request(app.getHttpServer())
      .get('/admin/ai-usage/summary')
      .query({ from: from.toISOString() })
      .set(auth(token));

  const ownModels = (body: { byModel: Array<{ model: string }> }) =>
    body.byModel.filter((entry) => entry.model.startsWith(slugPrefix));

  const cleanup = async () => {
    await prisma.aiUsageEvent.deleteMany({ where: { requestedModel: { startsWith: slugPrefix } } });
    await prisma.testPublicLink.deleteMany({ where: { shortCode } });
    await prisma.testTopic.deleteMany({ where: { slug: { startsWith: slugPrefix } } });
    await prisma.analysisPrompt.deleteMany({ where: { title: { startsWith: slugPrefix } } });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, userEmail] } } });
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiProviderConfigService)
      .useValue({
        getConnection: jest
          .fn()
          .mockResolvedValue({ ...TEST_AI_PROVIDER_CONNECTION, defaultModel: model }),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    client = app.get(AiProviderClientService);

    await cleanup();
    adminId = (
      await createE2eUser(prisma, {
        email: adminEmail,
        password,
        name: 'Usage Admin',
        role: 'ADMIN',
      })
    ).id;
    await createE2eUser(prisma, { email: userEmail, password, name: 'Usage User' });
    adminToken = await signin(adminEmail);
    userToken = await signin(userEmail);

    const prompt = await prisma.analysisPrompt.create({
      data: {
        title: `${slugPrefix}-prompt`,
        versions: {
          create: {
            versionNumber: 1,
            status: 'PUBLISHED',
            model,
            temperature: 0.2,
            prompt: 'Проанализируй ответы ученика',
            publishedAt: new Date(),
          },
        },
      },
      include: { versions: true },
    });
    const topic = await prisma.testTopic.create({ data: { slug: `${slugPrefix}-topic` } });
    const version = await prisma.testTopicVersion.create({
      data: {
        topicId: topic.id,
        versionNumber: 1,
        status: 'PUBLISHED',
        title: 'Учёт расходов',
        analysisPromptVersionId: prompt.versions[0].id,
      },
    });
    const link = await prisma.testPublicLink.create({
      data: {
        topicVersionId: version.id,
        shortCode,
        maxAttemptsPerStudent: 3,
        consentVersion: 'v1',
        consentTextSnapshot: 'Согласие для e2e.',
      },
    });
    attemptId = (
      await prisma.testStudentAttempt.create({
        data: {
          publicLinkId: link.id,
          topicVersionId: version.id,
          attemptNumber: 1,
          status: 'COMPLETED',
          studentName: 'Ученик',
          studentKeyHash: `${slugPrefix}-student`,
          consentAcceptedAt: new Date(),
          consentVersion: 'v1',
          consentTextSnapshot: 'Согласие для e2e.',
          resumeToken: `${slugPrefix}-resume`,
          finishedAt: new Date(),
        },
        select: { id: true },
      })
    ).id;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await prisma.aiUsageEvent.deleteMany({ where: { requestedModel: { startsWith: slugPrefix } } });
  });

  afterAll(async () => {
    await cleanup();
    await app.close();
  });

  describe('GET /admin/ai-usage/summary', () => {
    it('rejects a missing token, a non-admin and a malformed start of the period', async () => {
      const from = new Date(Date.now() - DAY);

      await request(app.getHttpServer())
        .get('/admin/ai-usage/summary')
        .query({ from: from.toISOString() })
        .expect(401);
      await summaryFrom(from, userToken).expect(403);
      await request(app.getHttpServer())
        .get('/admin/ai-usage/summary')
        .query({ from: 'yesterday' })
        .set(auth())
        .expect(400);
      await request(app.getHttpServer()).get('/admin/ai-usage/summary').set(auth()).expect(400);
    });

    it('counts only the calls inside the period the browser asked for', async () => {
      const now = Date.now();
      const event = (ageMs: number, extra: Record<string, unknown> = {}) => ({
        purpose: 'STUDENT_ANALYSIS' as const,
        status: 'SUCCESS' as const,
        provider: 'polza',
        requestedModel: model,
        durationMs: 100,
        promptTokens: 1000,
        completionTokens: 200,
        totalTokens: 1200,
        cost: '0.1',
        createdAt: new Date(now - ageMs),
        ...extra,
      });
      await prisma.aiUsageEvent.createMany({
        data: [event(60_000), event(3 * DAY), event(20 * DAY), event(40 * DAY)],
      });

      const callsSince = async (days: number) => {
        const response = await summaryFrom(new Date(now - days * DAY)).expect(200);
        return ownModels(response.body)[0]?.calls ?? 0;
      };

      expect(await callsSince(1)).toBe(1);
      expect(await callsSince(7)).toBe(2);
      expect(await callsSince(30)).toBe(3);
      expect(await callsSince(50)).toBe(4);
    });

    it('sums tokens and cost exactly and breaks them down by purpose and model', async () => {
      const base = {
        status: 'SUCCESS' as const,
        provider: 'polza',
        durationMs: 100,
        createdAt: new Date(),
      };
      await prisma.aiUsageEvent.createMany({
        data: [
          {
            ...base,
            purpose: 'STUDENT_ANALYSIS',
            requestedModel: model,
            actualModel: model,
            promptTokens: 1000,
            completionTokens: 200,
            totalTokens: 1200,
            cost: '0.1',
          },
          {
            ...base,
            purpose: 'TEST_GENERATION',
            requestedModel: model,
            actualModel: model,
            promptTokens: 10,
            completionTokens: 5,
            totalTokens: 15,
            cost: '0.2',
          },
          // The provider swapped the model: the call is counted under the one that answered.
          {
            ...base,
            purpose: 'STUDENT_ANALYSIS',
            requestedModel: model,
            actualModel: otherModel,
            promptTokens: 1,
            completionTokens: 1,
            totalTokens: 2,
          },
          {
            ...base,
            purpose: 'STUDENT_ANALYSIS',
            status: 'FAILED',
            failureReason: 'TIMEOUT',
            requestedModel: model,
          },
        ],
      });

      const response = await summaryFrom(new Date(Date.now() - DAY)).expect(200);
      const [main, swapped] = ownModels(response.body);

      expect(main).toMatchObject({
        model,
        calls: 3,
        failedCalls: 1,
        callsWithoutCost: 0,
        promptTokens: 1010,
        completionTokens: 205,
        totalTokens: 1215,
        cost: '0.30000000',
      });
      expect(swapped).toMatchObject({
        model: otherModel,
        calls: 1,
        callsWithoutCost: 1,
        cost: '0.00000000',
      });
      expect(response.body.totals.calls).toBeGreaterThanOrEqual(4);
      expect(response.body.byPurpose.map((entry: { purpose: string }) => entry.purpose)).toEqual(
        expect.arrayContaining(['STUDENT_ANALYSIS', 'TEST_GENERATION']),
      );
    });
  });

  describe('recording through the real provider client', () => {
    it('stores usage, cost and the actual model of an analysis call, linked to its attempt', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValue(
        jsonResponse(
          completionBody(otherModel, {
            prompt_tokens: 15_726,
            completion_tokens: 2_834,
            total_tokens: 18_560,
            cost: 0.1149,
          }),
        ),
      );

      await client.generatePrompt(
        { ...TEST_AI_PROVIDER_CONNECTION },
        { model, prompt: 'Тайный ответ ученика' },
        { usage: { purpose: 'STUDENT_ANALYSIS', attemptId } },
      );

      const [stored, ...rest] = await ownEvents();
      expect(rest).toEqual([]);
      expect(stored).toMatchObject({
        purpose: 'STUDENT_ANALYSIS',
        status: 'SUCCESS',
        provider: 'polza',
        requestedModel: model,
        actualModel: otherModel,
        promptTokens: 15_726,
        completionTokens: 2_834,
        totalTokens: 18_560,
        attemptId,
        failureReason: null,
      });
      expect(stored.cost?.toFixed(8)).toBe('0.11490000');
      // Nothing of the prompt or the answer reaches the table.
      expect(JSON.stringify(stored)).not.toContain('Тайный ответ ученика');
    });

    it('stores a refused call as failed and a provider without cost as an empty cost', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(jsonResponse({ error: { message: 'Bad key' } }, 401))
        .mockResolvedValueOnce(
          jsonResponse(completionBody(model, { prompt_tokens: 5, completion_tokens: 5 })),
        );

      await expect(
        client.generatePrompt(
          TEST_AI_PROVIDER_CONNECTION,
          { model, prompt: 'x' },
          { usage: { purpose: 'PROF_ORIENTATION_ENRICHMENT', attemptId } },
        ),
      ).rejects.toThrow('Bad key');
      await client.generatePrompt(
        TEST_AI_PROVIDER_CONNECTION,
        { model, prompt: 'x' },
        { usage: { purpose: 'PROF_ORIENTATION_ENRICHMENT', attemptId } },
      );

      const [failed, ok] = await ownEvents();
      expect(failed).toMatchObject({
        status: 'FAILED',
        failureReason: 'AUTH',
        promptTokens: null,
        cost: null,
      });
      expect(ok).toMatchObject({ status: 'SUCCESS', totalTokens: 10, cost: null });
    });

    it('keeps the record, without the link, when the attempt or the admin is deleted later', async () => {
      const extra = await createE2eUser(prisma, {
        email: `ai-usage-extra-e2e-${suffix}@example.com`,
        password,
      });
      await prisma.aiUsageEvent.create({
        data: {
          purpose: 'CONNECTION_CHECK',
          status: 'SUCCESS',
          provider: 'polza',
          requestedModel: model,
          durationMs: 1,
          actorUserId: extra.id,
          attemptId,
        },
      });

      await prisma.user.delete({ where: { id: extra.id } });
      await prisma.testStudentAttempt.deleteMany({ where: { id: attemptId } });

      const [stored] = await ownEvents();
      expect(stored).toMatchObject({ actorUserId: null, attemptId: null });
      expect(stored.purpose).toBe('CONNECTION_CHECK');
    });

    it('records the connection check pressed by an admin, and the question generation', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockImplementation(() =>
          Promise.resolve(
            jsonResponse(
              completionBody(model, { prompt_tokens: 3, completion_tokens: 1, cost: 0.0004 }),
            ),
          ),
        );

      await request(app.getHttpServer())
        .post('/admin/settings/ai-provider/check')
        .set(auth())
        .expect(200);
      await request(app.getHttpServer())
        .post('/admin/prompts/generate')
        .set(auth())
        .send({ model, prompt: 'Сгенерируй вопросы' })
        .expect(201);

      const events = await ownEvents();
      expect(events.map((entry) => [entry.purpose, entry.actorUserId])).toEqual([
        ['CONNECTION_CHECK', adminId],
        ['TEST_GENERATION', adminId],
      ]);
      expect(events.every((entry) => entry.cost?.toFixed(4) === '0.0004')).toBe(true);
    });
  });
});
