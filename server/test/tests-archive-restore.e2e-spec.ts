import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';

describe('Tests Archive/Restore (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now();
  const adminEmail = `admin-archive-e2e-${suffix}@example.com`;
  const memberEmail = `member-archive-e2e-${suffix}@example.com`;
  const testsSlugPrefix = `archive-e2e-${suffix}`;
  const password = 'Password123';

  let adminUserId = 0;
  let memberUserId = 0;
  let adminToken = '';
  let memberToken = '';

  const cleanupUsers = async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [adminEmail, memberEmail],
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

  const createTestTopic = async (token: string, slug: string, title?: string) => {
    const response = await request(app.getHttpServer())
      .post('/admin/tests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: title || 'Archive Test Topic',
        slug,
        description: 'Topic for testing archive/restore lifecycle',
      })
      .expect(201);

    return response.body.topicId as number;
  };

  const listTopics = async (token: string, archived?: string) => {
    const queryParams = archived ? { archived } : {};
    const response = await request(app.getHttpServer())
      .get('/admin/tests')
      .query(queryParams)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body;
  };

  const archiveTopic = async (token: string, topicId: number) => {
    const response = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body.topicId as number;
  };

  const restoreTopic = async (token: string, topicId: number) => {
    const response = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/restore`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body.topicId as number;
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

    const adminSignup = await signup(adminEmail, 'Admin Archive E2E');
    const memberSignup = await signup(memberEmail, 'Member Archive E2E');

    adminUserId = adminSignup.user.id;
    memberUserId = memberSignup.user.id;

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: 'ADMIN' },
    });

    adminToken = await signin(adminEmail);
    memberToken = await signin(memberEmail);
  });

  afterAll(async () => {
    await cleanupTestTopics();
    await cleanupUsers();
    await app.close();
  });

  it('should create topic and appear in active list by default', async () => {
    const topicSlug = `${testsSlugPrefix}-active-list`;
    const topicId = await createTestTopic(adminToken, topicSlug);

    // List active topics (default behavior, no archived param)
    const activeList = await listTopics(adminToken);
    const activeSlugs = (activeList.topics as Array<{ slug: string }>).map((topic) => topic.slug);

    expect(activeSlugs).toContain(topicSlug);
    expect(topicId).toBeGreaterThan(0);
  });

  it('should archive topic and move it to archived list', async () => {
    const topicSlug = `${testsSlugPrefix}-archive-test`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Archive Test');

    // Verify topic is in active list before archive
    const activeListBefore = await listTopics(adminToken);
    const activeSlugsBefore = (activeListBefore.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );
    expect(activeSlugsBefore).toContain(topicSlug);

    // Archive the topic
    await archiveTopic(adminToken, topicId);

    // Verify topic is NOT in active list after archive
    const activeListAfter = await listTopics(adminToken);
    const activeSlugsAfter = (activeListAfter.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );
    expect(activeSlugsAfter).not.toContain(topicSlug);

    // Verify topic IS in archived list
    const archivedList = await listTopics(adminToken, 'true');
    const archivedSlugs = (archivedList.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );
    expect(archivedSlugs).toContain(topicSlug);
  });

  it('should restore topic and move it back to active list', async () => {
    const topicSlug = `${testsSlugPrefix}-restore-test`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Restore Test');

    // Archive the topic first
    await archiveTopic(adminToken, topicId);

    // Verify topic is in archived list
    const archivedListBefore = await listTopics(adminToken, 'true');
    const archivedSlugsBefore = (archivedListBefore.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );
    expect(archivedSlugsBefore).toContain(topicSlug);

    // Restore the topic
    await restoreTopic(adminToken, topicId);

    // Verify topic is NOT in archived list after restore
    const archivedListAfter = await listTopics(adminToken, 'true');
    const archivedSlugsAfter = (archivedListAfter.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );
    expect(archivedSlugsAfter).not.toContain(topicSlug);

    // Verify topic IS back in active list
    const activeList = await listTopics(adminToken);
    const activeSlugs = (activeList.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(activeSlugs).toContain(topicSlug);
  });

  it('should return only active topics when archived=false', async () => {
    const activeSlug = `${testsSlugPrefix}-active-filter`;
    const archivedSlug = `${testsSlugPrefix}-archived-filter`;

    const activeTopicId = await createTestTopic(adminToken, activeSlug, 'Active Filter Test');
    const archivedTopicId = await createTestTopic(adminToken, archivedSlug, 'Archived Filter Test');

    // Archive one topic
    await archiveTopic(adminToken, archivedTopicId);

    // Query with archived=false
    const activeList = await listTopics(adminToken, 'false');
    const activeSlugs = (activeList.topics as Array<{ slug: string }>).map((topic) => topic.slug);

    expect(activeSlugs).toContain(activeSlug);
    expect(activeSlugs).not.toContain(archivedSlug);
  });

  it('should return only archived topics when archived=true', async () => {
    const activeSlug = `${testsSlugPrefix}-active-filter-2`;
    const archivedSlug = `${testsSlugPrefix}-archived-filter-2`;

    const activeTopicId = await createTestTopic(adminToken, activeSlug, 'Active Filter Test 2');
    const archivedTopicId = await createTestTopic(
      adminToken,
      archivedSlug,
      'Archived Filter Test 2',
    );

    // Archive one topic
    await archiveTopic(adminToken, archivedTopicId);

    // Query with archived=true
    const archivedList = await listTopics(adminToken, 'true');
    const archivedSlugs = (archivedList.topics as Array<{ slug: string }>).map(
      (topic) => topic.slug,
    );

    expect(archivedSlugs).toContain(archivedSlug);
    expect(archivedSlugs).not.toContain(activeSlug);
  });

  it('should reject archive action for non-admin user', async () => {
    const topicSlug = `${testsSlugPrefix}-member-archive`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Member Archive Test');

    const response = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/archive`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
  });

  it('should reject restore action for non-admin user', async () => {
    const topicSlug = `${testsSlugPrefix}-member-restore`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Member Restore Test');

    // Archive as admin first
    await archiveTopic(adminToken, topicId);

    const response = await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/restore`)
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
  });

  it('should reject archived list query for non-admin user', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/tests')
      .query({ archived: 'true' })
      .set('Authorization', `Bearer ${memberToken}`)
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: { message: 'Admin area only' },
    });
  });

  it('should support full archive/restore lifecycle in sequence', async () => {
    const topicSlug = `${testsSlugPrefix}-lifecycle`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Full Lifecycle Test');

    // Initial state: in active list
    const list1 = await listTopics(adminToken);
    const slugs1 = (list1.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(slugs1).toContain(topicSlug);

    // Archive
    await archiveTopic(adminToken, topicId);
    const list2 = await listTopics(adminToken);
    const slugs2 = (list2.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(slugs2).not.toContain(topicSlug);

    const archived2 = await listTopics(adminToken, 'true');
    const archivedSlugs2 = (archived2.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(archivedSlugs2).toContain(topicSlug);

    // Restore
    await restoreTopic(adminToken, topicId);
    const list3 = await listTopics(adminToken);
    const slugs3 = (list3.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(slugs3).toContain(topicSlug);

    const archived3 = await listTopics(adminToken, 'true');
    const archivedSlugs3 = (archived3.topics as Array<{ slug: string }>).map((topic) => topic.slug);
    expect(archivedSlugs3).not.toContain(topicSlug);
  });
});
