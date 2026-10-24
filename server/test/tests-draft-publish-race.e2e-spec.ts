import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

// #135: a draft edit racing a publish must land in the new draft or fail with 409,
// never silently change the version that was just published.
describe('Tests draft edit vs publish race (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken = '';

  const suffix = Date.now();
  const adminEmail = `admin-race-e2e-${suffix}@example.com`;
  const slug = `race-e2e-${suffix}`;
  const password = 'Password123';

  const api = () => request(app.getHttpServer());
  const auth = (req: request.Test) => req.set('Authorization', `Bearer ${adminToken}`);

  const versionContent = async (topicId: number, versionNumber: number) =>
    prisma.testTopicVersion.findUniqueOrThrow({
      where: { topicId_versionNumber: { topicId, versionNumber } },
      select: { title: true, questions: { select: { title: true } } },
    });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
    prisma = app.get(PrismaService);

    await createE2eUser(prisma, { email: adminEmail, password, name: 'Race E2E', role: 'ADMIN' });
    const signin = await api()
      .post('/auth/signin')
      .send({ email: adminEmail, password })
      .expect(200);
    adminToken = signin.body.accessToken as string;
  });

  afterAll(async () => {
    await prisma.testTopic.deleteMany({ where: { slug: { startsWith: slug } } });
    await prisma.user.deleteMany({ where: { email: adminEmail } });
    await app.close();
  });

  it('keeps a concurrent draft edit out of the published version', async () => {
    const created = await auth(api().post('/admin/tests'))
      .send({ title: 'v0', slug, description: null })
      .expect(201);
    const topicId = created.body.topicId as number;
    await auth(api().post(`/admin/tests/${topicId}/draft/questions`))
      .send({ type: 'OPEN_TEXT', title: 'q0', required: true })
      .expect(201);

    for (let round = 1; round <= 10; round += 1) {
      const draft = await auth(api().get(`/admin/tests/${topicId}/draft`)).expect(200);
      const questionId = draft.body.draft.questions[0].id as number;
      const title = `edit-${round}`;

      const [topicEdit, questionEdit, publish] = await Promise.all([
        auth(api().patch(`/admin/tests/${topicId}/draft`)).send({ title }),
        auth(api().patch(`/admin/tests/${topicId}/draft/questions/${questionId}`)).send({
          type: 'OPEN_TEXT',
          title,
          required: true,
        }),
        auth(api().post(`/admin/tests/${topicId}/publish`)),
      ]);

      expect(publish.status).toBe(200);
      const published = await versionContent(topicId, publish.body.publishedVersionNumber);
      const nextDraft = await versionContent(topicId, publish.body.newDraftVersionNumber);

      for (const [edit, read] of [
        [topicEdit, (v: typeof published) => v.title],
        [questionEdit, (v: typeof published) => v.questions[0].title],
      ] as const) {
        expect([200, 409]).toContain(edit.status);
        if (edit.status === 200) {
          // Saved before the publish took the draft, so the clone carries it.
          expect(read(nextDraft)).toBe(title);
        } else {
          expect(read(published)).not.toBe(title);
        }
      }
    }
  });

  it('answers a double publish with 409, not a unique-constraint 500', async () => {
    const created = await auth(api().post('/admin/tests'))
      .send({ title: 'double', slug: `${slug}-double`, description: null })
      .expect(201);
    const topicId = created.body.topicId as number;
    await auth(api().post(`/admin/tests/${topicId}/draft/questions`))
      .send({ type: 'OPEN_TEXT', title: 'q0', required: true })
      .expect(201);

    const responses = await Promise.all([
      auth(api().post(`/admin/tests/${topicId}/publish`)),
      auth(api().post(`/admin/tests/${topicId}/publish`)),
    ]);

    // A second publish that starts after the first commits legitimately publishes the new draft.
    expect(responses.map((response) => response.status)).toContain(200);
    for (const response of responses) {
      expect([200, 409]).toContain(response.status);
    }
  });
});
