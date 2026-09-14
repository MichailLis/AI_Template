import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

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
    await prisma.analysisPrompt.deleteMany({
      where: { title: { startsWith: testsSlugPrefix } },
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

    adminUserId = (
      await createE2eUser(prisma, {
        email: adminEmail,
        password,
        name: 'Admin Archive E2E',
        role: 'ADMIN',
      })
    ).id;
    memberUserId = (
      await createE2eUser(prisma, { email: memberEmail, password, name: 'Member Archive E2E' })
    ).id;

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

  it('should refuse to archive a prompt used by a pinned historical version with active public links or recoverable analysis', async () => {
    // 1. Create a prompt P1 with published version V1
    const prompt = await prisma.analysisPrompt.create({
      data: {
        title: `${testsSlugPrefix}-prompt`,
        description: 'Test prompt',
        versions: {
          create: {
            versionNumber: 1,
            status: 'PUBLISHED',
            model: 'google/gemini-2.0-flash-exp:free',
            temperature: 0.2,
            prompt: 'Test prompt {{answers}}',
            outputSchema: {},
            publishedAt: new Date(),
          },
        },
      },
      include: { versions: true },
    });
    const promptVersionId = prompt.versions[0].id;

    // 2. Create test topic with question and bind to prompt
    const topicSlug = `${testsSlugPrefix}-prompt-pin`;
    const topicId = await createTestTopic(adminToken, topicSlug, 'Pinned Prompt Test');

    const topic = await prisma.testTopic.findUniqueOrThrow({
      where: { id: topicId },
      include: { activeDraftVersion: true },
    });
    const draftId = topic.activeDraftVersion!.id;

    await prisma.testQuestion.create({
      data: {
        versionId: draftId,
        type: 'SINGLE_CHOICE',
        title: 'Q1',
        order: 1,
        options: {
          create: [
            { label: 'A', value: 'a', order: 1, weight: 1 },
            { label: 'B', value: 'b', order: 2, weight: 2 },
          ],
        },
      },
    });

    await prisma.testTopicVersion.update({
      where: { id: draftId },
      data: { analysisPromptVersionId: promptVersionId },
    });

    // 3. Publish topic -> V1 is published with P1
    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const topicAfterV1 = await prisma.testTopic.findUniqueOrThrow({
      where: { id: topicId },
    });
    const v1Id = topicAfterV1.activePublishedVersionId!;

    // 4. Create an active public link pinned to V1
    const linkCode = `LP_${suffix}`.slice(0, 16);
    const link = await prisma.testPublicLink.create({
      data: {
        topicVersionId: v1Id,
        shortCode: linkCode,
        isActive: true,
        consentVersion: '2026-07-09',
        consentTextSnapshot: 'Consent',
      },
    });

    // 5. Update draft (V2) to remove prompt and publish V2 -> V1 becomes ARCHIVED
    const v2Draft = topicAfterV1.activeDraftVersionId!;
    await prisma.testTopicVersion.update({
      where: { id: v2Draft },
      data: { analysisPromptVersionId: null },
    });

    await request(app.getHttpServer())
      .post(`/admin/tests/${topicId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // Verify V1 is indeed ARCHIVED and activePublishedVersion is now V2
    const topicAfterV2 = await prisma.testTopic.findUniqueOrThrow({
      where: { id: topicId },
      include: { activePublishedVersion: true },
    });
    expect(topicAfterV2.activePublishedVersionId).not.toBe(v1Id);

    const v1Record = await prisma.testTopicVersion.findUniqueOrThrow({
      where: { id: v1Id },
    });
    expect(v1Record.status).toBe('ARCHIVED');

    // 6. Attempt to archive prompt P1 -> MUST FAIL with 409 Conflict because active link still uses V1
    const archiveRes = await request(app.getHttpServer())
      .delete(`/admin/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    expect(archiveRes.body.error.message).toContain(
      `Analysis prompt is used by published tests: ${topicSlug}`,
    );

    await prisma.testTopic.update({ where: { id: topicId }, data: { archivedAt: new Date() } });
    await request(app.getHttpServer())
      .delete(`/admin/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    // 7. Deactivate / archive public link
    await prisma.testPublicLink.update({
      where: { id: link.id },
      data: { archivedAt: new Date(), isActive: false },
    });

    // 8. A completed attempt can still have recoverable hybrid analysis after its link and
    // topic are archived. Recovery intentionally scans these historical attempts.
    const pendingAttempt = await prisma.testStudentAttempt.create({
      data: {
        publicLinkId: link.id,
        topicVersionId: v1Id,
        attemptNumber: 1,
        status: 'COMPLETED',
        studentKeyHash: `${testsSlugPrefix}-pending-analysis`,
        resumeToken: `${testsSlugPrefix}-pending-analysis-token`,
        consentAcceptedAt: new Date(),
        consentVersion: '2026-07-09',
        consentTextSnapshot: 'Consent',
        finishedAt: new Date(),
        analysis: {
          create: {
            promptVersionId,
            providerMode: 'ALGORITHM_LLM',
            status: 'READY',
            summary: { llm: { status: 'pending' } },
          },
        },
      },
      include: { analysis: true },
    });

    // 9. Recoverable analysis still intends to execute P1, so archival MUST FAIL.
    await request(app.getHttpServer())
      .delete(`/admin/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    // 10. Once no active consumer remains, archival may proceed.
    await prisma.testStudentAnalysis.delete({ where: { id: pendingAttempt.analysis!.id } });

    await request(app.getHttpServer())
      .delete(`/admin/prompts/${prompt.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    // 11. An archived prompt must not become live again through link restoration.
    await request(app.getHttpServer())
      .post(`/admin/tests/public-links/${link.id}/restore`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(409);

    await expect(
      prisma.testPublicLink.findUniqueOrThrow({
        where: { id: link.id },
        select: { archivedAt: true, isActive: true },
      }),
    ).resolves.toMatchObject({ isActive: false });

    // 12. Clean up prompt
    await prisma.analysisPrompt.delete({ where: { id: prompt.id } });
  });
});
