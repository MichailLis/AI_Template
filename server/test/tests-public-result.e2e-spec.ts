import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { storedAiAnalysis } from '../src/tests/analysis/analysis-summary.spec-fixtures';
import { TestsPublicSessionService } from '../src/tests/session/public-session.service';
import { createE2eUser } from './helpers/create-e2e-user';

jest.setTimeout(60_000);

/**
 * The standard (non-prof-orientation) side of the public result contract and the serialization
 * safety net. The prof-orientation side lives in `prof-orientation-atlas-background.e2e-spec.ts`:
 * both suites import the same built-in methodology, and two importing in parallel race on its slug.
 */
describe('Public analysis result contract (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let sessionToken: string;
  const suffix = Date.now();
  const adminEmail = `public-result-admin-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const runId = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  const slug = `public-result-e2e-${runId.toLowerCase()}`;
  const shortCode = `R${runId}`;
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  const getResult = async () =>
    (await request(app.getHttpServer()).get(`/tests/public/sessions/${sessionToken}/result`)).body;

  const setAnalysis = (data: Prisma.TestStudentAnalysisUncheckedUpdateManyInput) =>
    prisma.testStudentAnalysis.updateMany({
      where: { attempt: { resumeToken: sessionToken } },
      data,
    });

  const readAnalysis = () =>
    prisma.testStudentAnalysis.findFirstOrThrow({
      where: { attempt: { resumeToken: sessionToken } },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await createE2eUser(prisma, { email: adminEmail, password, name: 'Result', role: 'ADMIN' });
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = signin.body.accessToken as string;

    const created = await request(app.getHttpServer())
      .post('/admin/tests')
      .set(auth())
      .send({ title: `Результат e2e ${runId}`, slug })
      .expect(201);
    const topicId = created.body.topicId as number;
    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/draft/questions`)
      .set(auth())
      .send({ type: 'OPEN_TEXT', title: 'Опишите ваш опыт', description: null, required: true })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set(auth())
      .expect(200);
    const draft = await request(app.getHttpServer())
      .get(`/admin/tests/${topicId}/draft`)
      .set(auth())
      .expect(200);
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
    sessionToken = start.body.session.sessionToken as string;
    await request(app.getHttpServer())
      .put(`/tests/public/sessions/${sessionToken}/answers`)
      .send({
        answers: [
          { questionId: start.body.session.questions[0].id, answerPayload: 'Собираю роботов' },
        ],
      })
      .expect(200);
  });

  afterAll(async () => {
    await prisma.testPublicLink.deleteMany({ where: { shortCode } });
    await prisma.testTopic.deleteMany({ where: { slug } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it('STUB: an explicit "no result" instead of the placeholder summary', async () => {
    const finished = (
      await request(app.getHttpServer())
        .post(`/tests/public/sessions/${sessionToken}/finish`)
        .expect(200)
    ).body;

    expect((await readAnalysis()).summary).toMatchObject({ mode: 'stub' });
    for (const body of [finished, await getResult()]) {
      expect(body.analysis).toMatchObject({ providerMode: 'STUB', status: 'READY' });
      expect(body.analysis.summary).toEqual({ resultKind: 'none' });
    }
  });

  it('AI analysis: the result under the ai_analysis kind, without extra keys', async () => {
    await setAnalysis({
      providerMode: 'LLM',
      status: 'READY',
      summary: { ...storedAiAnalysis, internalNote: 'do not show' },
    });

    const result = await getResult();

    expect(result.analysis.summary).toEqual({ resultKind: 'ai_analysis', ...storedAiAnalysis });
  });

  it.each(['PENDING', 'FAILED'] as const)(
    'AI analysis %s: no result yet, the status says why',
    async (status) => {
      await setAnalysis({ providerMode: 'LLM', status, summary: Prisma.JsonNull });

      const result = await getResult();

      expect(result.analysis).toMatchObject({ providerMode: 'LLM', status });
      expect(result.analysis.summary).toEqual({ resultKind: 'none' });
    },
  );

  it('cuts what a handler adds beyond its response schema and refuses a response that breaks it', async () => {
    await setAnalysis({ providerMode: 'STUB', status: 'READY', summary: { mode: 'stub' } });
    const real = await getResult();
    const spy = jest.spyOn(app.get(TestsPublicSessionService), 'getSessionResult');

    // A handler that returns more than the schema declares: the extra keys never reach the student.
    spy.mockResolvedValueOnce({
      ...real,
      rawText: 'provider output',
      analysis: { ...real.analysis, rawText: 'provider output', scores: { A1: 99 } },
    });
    const trimmed = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(200);
    expect(trimmed.body).toEqual(real);

    // A summary that is not one of the declared kinds is a server error, not a leak.
    spy.mockResolvedValueOnce({
      ...real,
      analysis: { ...real.analysis, summary: { scores: { A1: 99 }, selectedCounts: { A1: 10 } } },
    });
    const refused = await request(app.getHttpServer())
      .get(`/tests/public/sessions/${sessionToken}/result`)
      .expect(500);
    expect(refused.body).toMatchObject({ success: false, error: { statusCode: 500 } });
    expect(JSON.stringify(refused.body)).not.toContain('selectedCounts');

    spy.mockRestore();
  });
});
