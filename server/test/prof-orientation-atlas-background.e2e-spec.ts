import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AiProviderConfigService } from '../src/ai-provider/ai-provider-config.service';
import { AiProviderClientService } from '../src/ai-provider/ai-provider.client';
import { TEST_AI_PROVIDER_CONNECTION } from '../src/ai-provider/spec-fixtures';
import { AppModule } from '../src/app.module';
import { ProfessionAtlasClientService } from '../src/app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../src/app-settings/profession-atlas-settings.service';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

jest.setTimeout(90_000);

const ATLAS_DELAY_MS = 1500;

const enrichment = {
  professorSummary:
    'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели и проверять их на практике.',
  summary:
    'Профиль 3D-моделирования означает, что участнику ближе перевод идеи в точную цифровую модель и подготовку ее к производству.',
  confidenceComment:
    'Высокая уверенность связана с большим отрывом ведущего направления, устойчивыми выборами и достаточной готовностью по цифровым шкалам.',
  methodSignals: [
    'В большинстве вопросов выбран вариант, связанный с 3D-моделированием.',
    'Интерес к направлению A1 выше остальных интересов.',
  ],
  firstSteps: ['Смоделировать простой корпус устройства.', 'Сделать сборку из нескольких деталей.'],
  learningPlan: ['основы черчения', 'CAD/САПР'],
  professionNotes: ['Инженер-конструктор связан с разработкой деталей и сборок.'],
  nextMiniProject: 'Смоделируй корпус небольшого устройства и подготовь чертеж.',
  cautions: [],
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AnalysisSummary = { atlas?: unknown; llm?: { status?: string } };

describe('Prof-orientation atlas in the background task (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let releaseLlm: () => void;
  let llmGate: Promise<void>;
  const atlasCalls = { findProfessions: 0 };
  const suffix = Date.now();
  const adminEmail = `atlas-bg-admin-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const runId = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  const topicIds: number[] = [];

  const aiClient = {
    fetchModels: jest.fn().mockRejectedValue(new Error('no catalog')),
    generatePrompt: jest.fn(async () => {
      await llmGate;
      return { model: 'google/gemini-2.0-flash-exp:free', output: JSON.stringify(enrichment) };
    }),
  };
  const atlasClient = {
    findProfessions: jest.fn(async (_apiUrl: string, params: { q?: string }) => {
      atlasCalls.findProfessions += 1;
      await sleep(ATLAS_DELAY_MS);
      return [{ title: params.q ?? '', slug: `slug-${encodeURIComponent(params.q ?? '')}` }];
    }),
    getProfession: jest.fn(async (_apiUrl: string, slug: string) => ({
      title: decodeURIComponent(slug.replace('slug-', '')),
      slug,
      summary: 'Описание',
      description: 'Описание',
      demandLevel: 'high',
      industry: { name: 'Машиностроение' },
      municipality: { name: 'Казань' },
      skills: [{ name: 'CAD' }],
      educationPrograms: [],
    })),
    findEnterprises: jest.fn().mockResolvedValue([]),
    findEvents: jest.fn().mockResolvedValue([]),
    findInstitutions: jest.fn().mockResolvedValue([]),
  };
  const atlasSettings = {
    getProfessionAtlasConnection: jest.fn().mockResolvedValue({
      publicUrl: 'https://atlas.example',
      apiUrl: 'https://atlas.example/api-backend',
    }),
    getProfessionAtlasUrl: jest.fn().mockResolvedValue('https://atlas.example'),
  };

  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  const publishProfOrientation = async (label: string, withLlm: boolean) => {
    const imported = await request(app.getHttpServer())
      .post('/admin/tests/methodologies/prof-orientation-v3-plus/import')
      .set(auth())
      .expect(201);
    const topicId = imported.body.topicId as number;
    topicIds.push(topicId);
    if (!withLlm) {
      await prisma.testTopicVersion.updateMany({
        where: { topicId, status: 'DRAFT' },
        data: { analysisPromptVersionId: null },
      });
    }
    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set(auth())
      .expect(200);
    const draft = await request(app.getHttpServer())
      .get(`/admin/tests/${topicId}/draft`)
      .set(auth())
      .expect(200);
    const shortCode = `A${runId}${label}`;
    await request(app.getHttpServer())
      .post('/admin/tests/public-links')
      .set(auth())
      .send({
        publishedVersionId: draft.body.published.id,
        shortCode,
        maxAttemptsPerStudent: 3,
        timeLimitMinutes: null,
        allowResume: true,
        consentVersion: 'v1',
        consentText: 'Согласие для e2e.',
      })
      .expect(201);
    return shortCode;
  };

  const passTest = async (shortCode: string) => {
    const start = await request(app.getHttpServer())
      .post(`/tests/public/links/${shortCode}/start`)
      .send({
        studentName: 'Иван',
        studentLastInitial: 'И',
        studentMiddleInitial: 'О',
        educationOrganization: 'Лицей 42',
        groupOrClass: 'ИС-21',
        consentAccepted: true,
      })
      .expect(201);
    const sessionToken = start.body.session.sessionToken as string;
    const questions = start.body.session.questions as Array<{
      id: number;
      type: string;
      options: Array<{ value: string }>;
      settings: { min?: number } | null;
    }>;
    const answers = questions.map((question) => ({
      questionId: question.id,
      answerPayload:
        question.type === 'SLIDER'
          ? (question.settings?.min ?? 1)
          : question.type === 'MULTI_CHOICE'
            ? [question.options[0].value]
            : question.options[0]?.value,
    }));
    await request(app.getHttpServer())
      .put(`/tests/public/sessions/${sessionToken}/answers`)
      .send({ answers })
      .expect(200);
    return sessionToken;
  };

  const readSummary = async (sessionToken: string) => {
    const attempt = await prisma.testStudentAttempt.findUniqueOrThrow({
      where: { resumeToken: sessionToken },
      include: { analysis: true },
    });
    return {
      summary: attempt.analysis?.summary as AnalysisSummary | null,
      analysis: attempt.analysis,
    };
  };

  const waitFor = async (check: () => Promise<boolean>, what: string) => {
    const deadline = Date.now() + 20_000;
    while (Date.now() < deadline) {
      if (await check()) return;
      await sleep(100);
    }
    throw new Error(`Timed out waiting for ${what}`);
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AiProviderClientService)
      .useValue(aiClient)
      .overrideProvider(AiProviderConfigService)
      .useValue({ getConnection: jest.fn().mockResolvedValue(TEST_AI_PROVIDER_CONNECTION) })
      .overrideProvider(ProfessionAtlasClientService)
      .useValue(atlasClient)
      .overrideProvider(ProfessionAtlasSettingsService)
      .useValue(atlasSettings)
      .compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await createE2eUser(prisma, { email: adminEmail, password, name: 'Atlas BG', role: 'ADMIN' });
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = signin.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.testPublicLink.deleteMany({ where: { shortCode: { startsWith: `A${runId}` } } });
    await prisma.testTopic.deleteMany({ where: { id: { in: topicIds } } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it('with LLM: finish does not wait for the Atlas; atlas and AI text both end up in the result', async () => {
    llmGate = new Promise<void>((resolve) => {
      releaseLlm = resolve;
    });
    atlasCalls.findProfessions = 0;
    const shortCode = await publishProfOrientation('L', true);
    const sessionToken = await passTest(shortCode);

    const startedAt = Date.now();
    const finish = await request(app.getHttpServer())
      .post(`/tests/public/sessions/${sessionToken}/finish`)
      .expect(200);
    const finishMs = Date.now() - startedAt;

    expect(finishMs).toBeLessThan(ATLAS_DELAY_MS);
    expect(finish.body.analysis.summary.atlas).toBeUndefined();
    expect(finish.body.analysis.summary.llm.status).toBe('pending');

    // The result screen polls here: no extra Atlas requests, nothing is written.
    const early = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);
    expect(early.body.analysis.summary.llm.status).toBe('pending');

    // The background task stores the atlas while the LLM is still pending.
    await waitFor(async () => Boolean((await readSummary(sessionToken)).summary?.atlas), 'atlas');
    const midway = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);
    expect(midway.body.analysis.summary.atlas.status).toBe('ready');
    expect(midway.body.analysis.summary.atlas.professions).toHaveLength(2);
    expect(midway.body.analysis.summary.llm.status).toBe('pending');

    releaseLlm();
    await waitFor(
      async () => (await readSummary(sessionToken)).summary?.llm?.status === 'ready',
      'llm ready',
    );

    const done = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);
    expect(done.body.analysis.summary.llm.status).toBe('ready');
    expect(done.body.analysis.summary.llm.analysis.professorSummary).toBe(
      enrichment.professorSummary,
    );
    expect(done.body.analysis.summary.atlas.status).toBe('ready');
    expect(done.body.analysis.summary.atlas.professions).toHaveLength(2);
    expect((await readSummary(sessionToken)).analysis?.rawText).toBe(JSON.stringify(enrichment));
    // Two professions looked up once each: finish, GET /result and the task did not repeat it.
    expect(atlasCalls.findProfessions).toBe(2);
  });

  it('without LLM: finish brings the atlas synchronously', async () => {
    atlasCalls.findProfessions = 0;
    const shortCode = await publishProfOrientation('N', false);
    const sessionToken = await passTest(shortCode);

    const startedAt = Date.now();
    const finish = await request(app.getHttpServer())
      .post(`/tests/public/sessions/${sessionToken}/finish`)
      .expect(200);
    const finishMs = Date.now() - startedAt;

    expect(finishMs).toBeGreaterThanOrEqual(ATLAS_DELAY_MS - 100);
    expect(finish.body.analysis.summary.llm.status).toBe('not_requested');
    expect(finish.body.analysis.summary.atlas.status).toBe('ready');
    expect(finish.body.analysis.summary.atlas.professions).toHaveLength(2);

    const result = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);
    expect(result.body.analysis.summary.atlas.status).toBe('ready');
    expect(atlasCalls.findProfessions).toBe(2);
  });
});
