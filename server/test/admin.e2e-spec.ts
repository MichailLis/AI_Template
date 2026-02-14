import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `admin-e2e-${suffix}@example.com`;
  const memberEmail = `member-e2e-${suffix}@example.com`;
  const viewerEmail = `viewer-e2e-${suffix}@example.com`;
  const testsSlugPrefix = `e2e-tests-${suffix}`;
  const password = 'Password123';

  let adminUserId = 0;
  let memberUserId = 0;

  const cleanupUsers = async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, memberEmail, viewerEmail],
        },
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

  const signup = async (email: string, name: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email,
        password,
        name,
      })
      .expect(201);

    return response.body;
  };

  const signin = async (email: string) => {
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email,
        password,
      })
      .expect(200);

    return response.body.accessToken as string;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupTestTopics();
    await cleanupUsers();

    const adminSignup = await signup(adminEmail, 'Admin E2E');
    const memberSignup = await signup(memberEmail, 'Member E2E');
    await signup(viewerEmail, 'Viewer E2E');

    adminUserId = adminSignup.user.id;
    memberUserId = memberSignup.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });
  });

  afterAll(async () => {
    await cleanupTestTopics();
    await cleanupUsers();
    await app.close();
  });

  it('GET /admin/users should return paginated users for admin', async () => {
    const adminToken = await signin(adminEmail);

    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .query({
        page: 1,
        limit: 5,
        role: 'USER',
        search: 'e2e',
        sortBy: 'createdAt',
        sortOrder: 'asc',
      })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(5);
    expect(response.body.total).toBeGreaterThanOrEqual(2);
    expect(response.body.totalPages).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(response.body.users)).toBe(true);

    const createdAtValues = (
      response.body.users as Array<{ createdAt: string }>
    ).map((user) => new Date(user.createdAt).getTime());
    const sortedValues = [...createdAtValues].sort((a, b) => a - b);

    expect(createdAtValues).toEqual(sortedValues);
  });

  it('GET /admin/users should reject non-admin token', async () => {
    const viewerToken = await signin(viewerEmail);

    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    const message = Array.isArray(response.body.message)
      ? response.body.message[0]
      : response.body.message;

    expect(message).toBe('Admin area only');
  });

  it('PATCH /admin/users/:id/role should update target role', async () => {
    const adminToken = await signin(adminEmail);

    const response = await request(app.getHttpServer())
      .patch(`/admin/users/${memberUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'ADMIN' })
      .expect(200);

    expect(response.body.id).toBe(memberUserId);
    expect(response.body.role).toBe('ADMIN');
  });

  it('PATCH /admin/users/:id/role should block self demotion', async () => {
    const adminToken = await signin(adminEmail);

    const response = await request(app.getHttpServer())
      .patch(`/admin/users/${adminUserId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'USER' })
      .expect(403);

    const message = Array.isArray(response.body.message)
      ? response.body.message[0]
      : response.body.message;

    expect(message).toBe('Admin cannot revoke own admin role');
  });

  it('tests module should reject non-admin token', async () => {
    const viewerToken = await signin(viewerEmail);

    const response = await request(app.getHttpServer())
      .get('/admin/tests')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    const message = Array.isArray(response.body.message)
      ? response.body.message[0]
      : response.body.message;

    expect(message).toBe('Admin area only');
  });

  it('tests module should support create, reorder, and publish flow for admin', async () => {
    const adminToken = await signin(adminEmail);
    const topicSlug = `${testsSlugPrefix}-main`;

    const createTopicResponse = await request(app.getHttpServer())
      .post('/admin/tests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Тест',
        slug: topicSlug,
        description: 'Тестовый сценарий e2e',
      })
      .expect(201);

    const topicId = createTopicResponse.body.topicId as number;
    expect(createTopicResponse.body.slug).toBe(topicSlug);
    expect(createTopicResponse.body.draft.versionNumber).toBe(1);
    expect(createTopicResponse.body.published).toBeNull();

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/draft/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'OPEN_TEXT',
        title: 'Первый вопрос',
        description: null,
        required: true,
      })
      .expect(201);

    const secondQuestionResponse = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/draft/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        type: 'OPEN_TEXT',
        title: 'Второй вопрос',
        description: null,
        required: true,
      })
      .expect(201);

    const questions = secondQuestionResponse.body.draft.questions as Array<{
      id: number;
      title: string;
      order: number;
    }>;

    expect(questions).toHaveLength(2);
    expect(questions.map((question) => question.order)).toEqual([1, 2]);

    const firstQuestion = questions.find(
      (question) => question.title === 'Первый вопрос',
    );
    const secondQuestion = questions.find(
      (question) => question.title === 'Второй вопрос',
    );

    expect(firstQuestion).toBeDefined();
    expect(secondQuestion).toBeDefined();

    const reorderResponse = await request(app.getHttpServer())
      .patch(`/admin/tests/${topicId}/draft/questions/reorder`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        questionIds: [secondQuestion!.id, firstQuestion!.id],
      })
      .expect(200);

    const reorderedQuestions = reorderResponse.body.draft.questions as Array<{
      id: number;
      order: number;
    }>;

    expect(reorderedQuestions[0].id).toBe(secondQuestion!.id);
    expect(reorderedQuestions[1].id).toBe(firstQuestion!.id);
    expect(reorderedQuestions.map((question) => question.order)).toEqual([
      1, 2,
    ]);

    const publishResponse = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(publishResponse.body.topicId).toBe(topicId);
    expect(publishResponse.body.publishedVersionNumber).toBe(1);
    expect(publishResponse.body.newDraftVersionNumber).toBe(2);

    const draftAfterPublish = await request(app.getHttpServer())
      .get(`/admin/tests/${topicId}/draft`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(draftAfterPublish.body.draft.versionNumber).toBe(2);
    expect(draftAfterPublish.body.published.versionNumber).toBe(1);
    expect(
      (draftAfterPublish.body.draft.questions as Array<{ title: string }>).map(
        (question) => question.title,
      ),
    ).toEqual(['Второй вопрос', 'Первый вопрос']);
  });
});
