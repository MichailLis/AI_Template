import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import ExcelJS from 'exceljs';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

jest.setTimeout(60_000);

/**
 * The admin deletes one student attempt: it leaves the list and the export, its answers and
 * analysis go with it, and the journal keeps only ids. Guards for the route are checked for every
 * /admin route in `admin-guards.e2e-spec.ts`.
 */
describe('Admin deletes a student attempt (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let adminId: number;
  let linkId: number;
  let otherLinkId: number;
  let attemptId: number;
  const suffix = Date.now();
  const adminEmail = `attempt-delete-admin-e2e-${suffix}@example.com`;
  const password = 'Password123';
  const runId = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();
  const slug = `attempt-delete-e2e-${runId.toLowerCase()}`;
  const shortCode = `D${runId}`;
  const otherShortCode = `O${runId}`;
  const auth = () => ({ Authorization: `Bearer ${adminToken}` });

  const attemptsOf = async (id: number) =>
    (
      await request(app.getHttpServer())
        .get(`/admin/tests/public-links/${id}/attempts`)
        .set(auth())
        .expect(200)
    ).body.attempts as Array<{ attemptId: number }>;

  // The export is one sheet: the header row and one row per attempt.
  const exportedRowCount = async () => {
    const response = await request(app.getHttpServer())
      .get(`/admin/tests/public-links/${linkId}/attempts/export.xlsx`)
      .set(auth())
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);
    const workbook = new ExcelJS.Workbook();

    await workbook.xlsx.load(response.body as Buffer);

    return workbook.worksheets[0].rowCount;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);
    await createE2eUser(prisma, { email: adminEmail, password, name: 'Delete', role: 'ADMIN' });
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = signin.body.accessToken as string;
    adminId = (await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } })).id;

    const created = await request(app.getHttpServer())
      .post('/admin/tests')
      .set(auth())
      .send({ title: `Удаление попытки e2e ${runId}`, slug })
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
    const publishedVersionId = draft.body.published.id as number;

    // Links are written straight to the database: the HTTP create runs a serializable transaction,
    // which other e2e suites writing in parallel can make fail with TransactionWriteConflict.
    const createLink = (code: string) =>
      prisma.testPublicLink.create({
        data: {
          topicVersionId: publishedVersionId,
          shortCode: code,
          isActive: true,
          maxAttemptsPerStudent: 3,
          allowResume: false,
          consentVersion: 'v1',
          consentTextSnapshot: 'Согласие для e2e.',
        },
      });
    linkId = (await createLink(shortCode)).id;
    otherLinkId = (await createLink(otherShortCode)).id;

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
    await request(app.getHttpServer())
      .put(`/tests/public/sessions/${sessionToken}/answers`)
      .send({
        answers: [
          { questionId: start.body.session.questions[0].id, answerPayload: 'Собираю роботов' },
        ],
      })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/tests/public/sessions/${sessionToken}/finish`)
      .expect(200);

    attemptId = (
      await prisma.testStudentAttempt.findUniqueOrThrow({ where: { resumeToken: sessionToken } })
    ).id;
  });

  afterAll(async () => {
    await prisma.testPublicLink.deleteMany({
      where: { shortCode: { in: [shortCode, otherShortCode] } },
    });
    await prisma.testTopic.deleteMany({ where: { slug } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it('lists the attempt, with its answer and analysis, before deletion', async () => {
    expect((await attemptsOf(linkId)).map((attempt) => attempt.attemptId)).toContain(attemptId);
    expect(await prisma.testStudentAnswer.count({ where: { attemptId } })).toBe(1);
    expect(await prisma.testStudentAnalysis.count({ where: { attemptId } })).toBe(1);
    expect(await exportedRowCount()).toBe(2);
  });

  it('answers 404 for an attempt that belongs to another link and deletes nothing', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/tests/public-links/${otherLinkId}/attempts/${attemptId}`)
      .set(auth())
      .expect(404);

    expect(response.body).toMatchObject({
      success: false,
      error: { code: 'ATTEMPT_NOT_FOUND' },
    });
    expect(await prisma.testStudentAttempt.count({ where: { id: attemptId } })).toBe(1);
  });

  it('deletes the attempt with its answers and analysis and returns the ids', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/tests/public-links/${linkId}/attempts/${attemptId}`)
      .set(auth())
      .expect(200);

    expect(response.body).toEqual({ linkId, attemptId });
    expect(await prisma.testStudentAttempt.count({ where: { id: attemptId } })).toBe(0);
    expect(await prisma.testStudentAnswer.count({ where: { attemptId } })).toBe(0);
    expect(await prisma.testStudentAnalysis.count({ where: { attemptId } })).toBe(0);
  });

  it('removes the attempt from the list and from the export', async () => {
    expect((await attemptsOf(linkId)).map((attempt) => attempt.attemptId)).not.toContain(attemptId);
    expect(await exportedRowCount()).toBe(1);
  });

  it('answers 404 to a second delete of the same attempt', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/tests/public-links/${linkId}/attempts/${attemptId}`)
      .set(auth())
      .expect(404);

    expect(response.body).toMatchObject({ success: false, error: { code: 'ATTEMPT_NOT_FOUND' } });
  });

  it('journals the deletion with the ids only, never the student data', async () => {
    const event = await prisma.auditEvent.findFirstOrThrow({
      where: { action: 'ATTEMPT_DELETED', entityId: String(linkId) },
    });

    expect(event).toMatchObject({
      entityType: 'PUBLIC_LINK',
      actorUserId: adminId,
      changes: [{ field: 'attemptId', before: String(attemptId), after: null }],
    });
    expect(JSON.stringify(event)).not.toContain('Иван');
    expect(JSON.stringify(event)).not.toContain('ИС-21');
  });
});
