import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

describe('Admin (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `admin-e2e-${suffix}@example.com`;
  const memberEmail = `member-e2e-${suffix}@example.com`;
  const viewerEmail = `viewer-e2e-${suffix}@example.com`;
  const managedEmailPrefix = `managed-e2e-${suffix}`;
  const testsSlugPrefix = `e2e-tests-${suffix}`;
  const password = 'Password123';

  let adminUserId = 0;
  let memberUserId = 0;

  const cleanupUsers = async () => {
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { in: [adminEmail, memberEmail, viewerEmail] } },
          { email: { startsWith: managedEmailPrefix } },
        ],
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

  const getRefreshCookie = (response: request.Response) => {
    const setCookieHeader = response.headers['set-cookie'] as unknown as string[] | undefined;
    const refreshCookie = setCookieHeader?.find((cookie) => cookie.startsWith('refreshToken='));

    expect(refreshCookie).toBeDefined();

    return refreshCookie!.split(';')[0];
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    await cleanupTestTopics();
    await cleanupUsers();

    adminUserId = (
      await createE2eUser(prisma, { email: adminEmail, password, name: 'Admin E2E', role: 'ADMIN' })
    ).id;
    memberUserId = (
      await createE2eUser(prisma, { email: memberEmail, password, name: 'Member E2E' })
    ).id;
    await createE2eUser(prisma, { email: viewerEmail, password, name: 'Viewer E2E' });
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

    const createdAtValues = (response.body.users as Array<{ createdAt: string }>).map((user) =>
      new Date(user.createdAt).getTime(),
    );
    const sortedValues = [...createdAtValues].sort((a, b) => a - b);

    expect(createdAtValues).toEqual(sortedValues);
  });

  it('GET /admin/users should reject non-admin token', async () => {
    const viewerToken = await signin(viewerEmail);

    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
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

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin cannot revoke own admin role' },
    });
  });

  it('POST /admin/users should create a user whose generated password signs in', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-created@example.com`;

    const response = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: ` ${email.toUpperCase()} `, name: 'Managed E2E' })
      .expect(201);

    expect(response.body.user).toMatchObject({
      email,
      name: 'Managed E2E',
      role: 'USER',
      deactivatedAt: null,
      lastLoginAt: null,
    });
    expect(typeof response.body.generatedPassword).toBe('string');

    const signinResponse = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password: response.body.generatedPassword as string })
      .expect(200);

    expect(signinResponse.body.user).toMatchObject({ email, role: 'USER' });
  });

  it('POST /admin/users should keep a supplied password and reject a taken email', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-supplied@example.com`;

    const response = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password, role: 'ADMIN' })
      .expect(201);

    expect(response.body.generatedPassword).toBeNull();
    expect(response.body.user.role).toBe('ADMIN');
    await signin(email);

    const duplicate = await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email, password })
      .expect(409);

    expect(duplicate.body).toMatchObject({
      success: false,
      error: { message: 'Email already exists' },
    });
  });

  it('POST /admin/users should reject non-admin token', async () => {
    const viewerToken = await signin(viewerEmail);

    await request(app.getHttpServer())
      .post('/admin/users')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ email: `${managedEmailPrefix}-forbidden@example.com` })
      .expect(403);
  });

  it('PATCH /admin/users/:id should update email and clear name', async () => {
    const adminToken = await signin(adminEmail);
    const user = await createE2eUser(prisma, {
      email: `${managedEmailPrefix}-edit@example.com`,
      password,
      name: 'Before Edit',
    });
    const nextEmail = `${managedEmailPrefix}-edited@example.com`;

    const response = await request(app.getHttpServer())
      .patch(`/admin/users/${user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: nextEmail, name: null })
      .expect(200);

    expect(response.body).toMatchObject({ id: user.id, email: nextEmail, name: null });

    await request(app.getHttpServer())
      .patch(`/admin/users/${user.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: adminEmail })
      .expect(409);

    await request(app.getHttpServer())
      .patch('/admin/users/2147483647')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Nobody' })
      .expect(404);
  });

  it('POST /admin/users/:id/password should replace the password and end sessions', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-reset@example.com`;
    const user = await createE2eUser(prisma, { email, password });

    const userSignin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);
    const refreshCookie = getRefreshCookie(userSignin);

    const response = await request(app.getHttpServer())
      .post(`/admin/users/${user.id}/password`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({})
      .expect(200);
    const nextPassword = response.body.generatedPassword as string;

    expect(nextPassword).toHaveLength(12);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(403);
    await request(app.getHttpServer()).post('/auth/signin').send({ email, password }).expect(403);
    await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password: nextPassword })
      .expect(200);
  });

  it('PATCH /admin/users/:id/status should lock a user out until reactivated', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-status@example.com`;
    const user = await createE2eUser(prisma, { email, password });

    const deactivated = await request(app.getHttpServer())
      .patch(`/admin/users/${user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DEACTIVATED' })
      .expect(200);

    expect(typeof deactivated.body.deactivatedAt).toBe('string');

    const rejected = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(403);

    expect(rejected.body).toMatchObject({
      success: false,
      error: { message: 'Account is deactivated' },
    });

    const filtered = await request(app.getHttpServer())
      .get('/admin/users')
      .query({ status: 'DEACTIVATED', search: managedEmailPrefix })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const filteredUsers = filtered.body.users as Array<{ id: number; deactivatedAt: unknown }>;

    expect(filteredUsers.map((item) => item.id)).toContain(user.id);
    expect(filteredUsers.every((item) => item.deactivatedAt !== null)).toBe(true);

    const reactivated = await request(app.getHttpServer())
      .patch(`/admin/users/${user.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'ACTIVE' })
      .expect(200);

    expect(reactivated.body.deactivatedAt).toBeNull();
    await signin(email);
  });

  it('PATCH /admin/users/:id/status should cut a deactivated admin off at once', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-admin-status@example.com`;
    const secondAdmin = await createE2eUser(prisma, { email, password, role: 'ADMIN' });
    const secondAdminToken = await signin(email);

    await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${secondAdminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/admin/users/${secondAdmin.id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DEACTIVATED' })
      .expect(200);

    // The access token is still inside its 15 minutes, but the admin check reads the database.
    const response = await request(app.getHttpServer())
      .get('/admin/users')
      .set('Authorization', `Bearer ${secondAdminToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
  });

  it('PATCH /admin/users/:id/status should block self deactivation', async () => {
    const adminToken = await signin(adminEmail);

    const response = await request(app.getHttpServer())
      .patch(`/admin/users/${adminUserId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'DEACTIVATED' })
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin cannot deactivate own account' },
    });
  });

  it('POST /admin/users/:id/sessions/revoke should invalidate the refresh token', async () => {
    const adminToken = await signin(adminEmail);
    const email = `${managedEmailPrefix}-sessions@example.com`;
    const user = await createE2eUser(prisma, { email, password });

    const userSignin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email, password })
      .expect(200);
    const refreshCookie = getRefreshCookie(userSignin);

    await request(app.getHttpServer())
      .post(`/admin/users/${user.id}/sessions/revoke`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', refreshCookie)
      .expect(403);
  });

  it('tests module should reject non-admin token', async () => {
    const viewerToken = await signin(viewerEmail);

    const response = await request(app.getHttpServer())
      .get('/admin/tests')
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
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

    const firstQuestion = questions.find((question) => question.title === 'Первый вопрос');
    const secondQuestion = questions.find((question) => question.title === 'Второй вопрос');

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
    expect(reorderedQuestions.map((question) => question.order)).toEqual([1, 2]);

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

  it('tests module should delete topic for admin', async () => {
    const adminToken = await signin(adminEmail);
    const topicSlug = `${testsSlugPrefix}-delete`;

    const createTopicResponse = await request(app.getHttpServer())
      .post('/admin/tests')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Тест на удаление',
        slug: topicSlug,
        description: 'Будет удален в рамках e2e',
      })
      .expect(201);

    const topicId = createTopicResponse.body.topicId as number;

    const deleteResponse = await request(app.getHttpServer())
      .delete(`/admin/tests/${topicId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(deleteResponse.body.topicId).toBe(topicId);

    const listResponse = await request(app.getHttpServer())
      .get('/admin/tests')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const topicSlugs = (listResponse.body.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );

    expect(topicSlugs).not.toContain(topicSlug);
  });

  it('tests module should create topic from AI blueprint in one request', async () => {
    const adminToken = await signin(adminEmail);

    const createFromAiResponse = await request(app.getHttpServer())
      .post('/admin/tests/ai/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'AI Blueprint Test',
        slug: `${testsSlugPrefix}-ai-blueprint`,
        description: 'Создано по результату генерации ИИ',
        questions: [
          {
            type: 'OPEN_TEXT',
            title: 'Что вам нравится делать больше всего?',
            description: 'Коротко опишите любимые занятия',
            required: true,
          },
          {
            type: 'SINGLE_CHOICE',
            title: 'Какой формат задач вам ближе?',
            description: null,
            required: true,
            options: [
              {
                label: 'Точные расчеты и алгоритмы',
                value: 'engineering_math',
                weight: 3,
              },
              {
                label: 'Коммуникация и работа с людьми',
                value: 'communication_people',
                weight: 1,
              },
            ],
          },
        ],
      })
      .expect(201);

    expect(createFromAiResponse.body.slug).toBe(`${testsSlugPrefix}-ai-blueprint`);
    expect(createFromAiResponse.body.draft.versionNumber).toBe(1);
    expect(createFromAiResponse.body.draft.questions).toHaveLength(2);
    expect(createFromAiResponse.body.draft.questions[0].title).toBe(
      'Что вам нравится делать больше всего?',
    );
    expect(createFromAiResponse.body.draft.questions[1].type).toBe('SINGLE_CHOICE');
  });

  it('tests module should reject invalid AI blueprint payload', async () => {
    const adminToken = await signin(adminEmail);
    const invalidSlug = `${testsSlugPrefix}-ai-invalid`;

    const response = await request(app.getHttpServer())
      .post('/admin/tests/ai/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Invalid AI Blueprint',
        slug: invalidSlug,
        questions: [
          {
            type: 'SINGLE_CHOICE',
            title: 'Недостаточно вариантов',
            required: true,
            options: [
              {
                label: 'Единственный вариант',
                value: 'only_one',
                weight: 1,
              },
            ],
          },
        ],
      })
      .expect(400);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        message: expect.stringContaining('requires at least two options'),
      },
    });

    const createdTopic = await prisma.testTopic.findUnique({
      where: {
        slug: invalidSlug,
      },
      select: { id: true },
    });

    expect(createdTopic).toBeNull();
  });

  it('tests module should cover archive/restore lifecycle and admin access control', async () => {
    const lifecycleSuffix = Date.now();
    const lifecycleAdminEmail = `archive-admin-e2e-${suffix}-${lifecycleSuffix}@example.com`;
    const lifecycleTopicSlug = `${testsSlugPrefix}-archive-restore-${lifecycleSuffix}`;
    const lifecycleTopicTitle = `Archive Restore E2E ${lifecycleSuffix}`;

    await createE2eUser(prisma, {
      email: lifecycleAdminEmail,
      password,
      name: 'Archive Admin E2E',
    });

    const lifecycleAdmin = await prisma.user.findUniqueOrThrow({
      where: { email: lifecycleAdminEmail },
      select: { id: true },
    });

    await prisma.user.update({
      where: { id: lifecycleAdmin.id },
      data: { role: 'ADMIN' },
    });

    const lifecycleAdminToken = await signin(lifecycleAdminEmail);

    const createTopicResponse = await request(app.getHttpServer())
      .post('/admin/tests')
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .send({
        title: lifecycleTopicTitle,
        slug: lifecycleTopicSlug,
        description: 'Archive/restore e2e lifecycle',
      })
      .expect(201);

    const topicId = createTopicResponse.body.topicId as number;

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/archive`)
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const activeAfterArchiveResponse = await request(app.getHttpServer())
      .get('/admin/tests')
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const activeAfterArchiveSlugs = (
      activeAfterArchiveResponse.body.topics as Array<{ slug: string }>
    ).map((topic) => topic.slug);
    expect(activeAfterArchiveSlugs).not.toContain(lifecycleTopicSlug);

    const archivedAfterArchiveResponse = await request(app.getHttpServer())
      .get('/admin/tests')
      .query({ archived: true })
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const archivedAfterArchiveSlugs = (
      archivedAfterArchiveResponse.body.topics as Array<{ slug: string }>
    ).map((topic) => topic.slug);
    expect(archivedAfterArchiveSlugs).toContain(lifecycleTopicSlug);

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/restore`)
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const activeAfterRestoreResponse = await request(app.getHttpServer())
      .get('/admin/tests')
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const activeAfterRestoreSlugs = (
      activeAfterRestoreResponse.body.topics as Array<{ slug: string }>
    ).map((topic) => topic.slug);
    expect(activeAfterRestoreSlugs).toContain(lifecycleTopicSlug);

    const archivedAfterRestoreResponse = await request(app.getHttpServer())
      .get('/admin/tests')
      .query({ archived: true })
      .set('Authorization', `Bearer ${lifecycleAdminToken}`)
      .expect(200);

    const archivedAfterRestoreSlugs = (
      archivedAfterRestoreResponse.body.topics as Array<{ slug: string }>
    ).map((topic) => topic.slug);
    expect(archivedAfterRestoreSlugs).not.toContain(lifecycleTopicSlug);

    const viewerToken = await signin(viewerEmail);

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/archive`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/restore`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .expect(403);

    await prisma.user.deleteMany({
      where: { email: lifecycleAdminEmail },
    });
  });
});
