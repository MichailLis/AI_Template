import { randomUUID } from 'node:crypto';

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';
import { setupApp } from '../src/setup-app';
import { createE2eUser } from './helpers/create-e2e-user';

describe('Test topic list concurrent cleanup (e2e)', () => {
  let app: INestApplication;
  let reader: PrismaClient;
  let writer: PrismaService;
  let token: string;
  let userId: number;
  let survivorId: number;
  let victimId: number;
  let afterActiveLinkRead: (() => Promise<void>) | undefined;
  const prefix = `topic-list-e2e-${randomUUID()}`;

  beforeAll(async () => {
    writer = new PrismaService(new ConfigService());
    const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
    const connect = adapter.connect.bind(adapter);
    adapter.connect = async () => {
      const connection = await connect();
      const queryRaw = connection.queryRaw.bind(connection);
      connection.queryRaw = async (query) => {
        const result = await queryRaw(query);
        // Let the real SQL finish, then commit another connection's cascading deletion
        // before Prisma assembles relations. No mocked rows, sleeps, or retries.
        if (
          afterActiveLinkRead &&
          query.sql.includes('"test_public_links"') &&
          query.sql.includes('"isActive"')
        ) {
          const cleanup = afterActiveLinkRead;
          afterActiveLinkRead = undefined;
          await cleanup();
        }
        return result;
      };
      return connection;
    };
    reader = new PrismaClient({ adapter });
    const moduleFixture = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue(reader)
      .compile();
    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();

    userId = (
      await createE2eUser(writer, {
        email: `${prefix}@example.com`,
        password: 'Password123',
        role: 'ADMIN',
      })
    ).id;
    const signin = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: `${prefix}@example.com`, password: 'Password123' })
      .expect(200);
    token = signin.body.accessToken as string;

    const createTopic = async (label: string, versionCount: number) => {
      const topic = await writer.testTopic.create({
        data: {
          slug: `${prefix}-${label}`,
          versions: {
            create: Array.from({ length: versionCount }, (_, index) => ({
              title: label,
              versionNumber: index + 1,
              status: index === 0 && versionCount > 1 ? 'ARCHIVED' : 'DRAFT',
              publicLinks: {
                create: [
                  { isActive: true },
                  { isActive: false },
                  { isActive: true, archivedAt: new Date() },
                ].map((state) => ({
                  ...state,
                  shortCode: randomUUID(),
                  consentVersion: 'test',
                  consentTextSnapshot: 'test',
                })),
              },
            })),
          },
        },
        include: { versions: { orderBy: { versionNumber: 'desc' } } },
      });
      await writer.testTopic.update({
        where: { id: topic.id },
        data: { activeDraftVersionId: topic.versions[0].id },
      });
      return topic.id;
    };
    survivorId = await createTopic('survivor', 2);
    victimId = await createTopic('victim', 1);
  });

  afterAll(async () => {
    afterActiveLinkRead = undefined;
    await writer.testTopic.deleteMany({ where: { slug: { startsWith: prefix } } });
    if (userId) await writer.user.delete({ where: { id: userId } });
    await app.close();
    await reader.$disconnect();
    await writer.onModuleDestroy();
  });

  const listTopics = () =>
    request(app.getHttpServer()).get('/admin/tests').set('Authorization', `Bearer ${token}`);

  it('counts active unarchived links across historical and draft versions', async () => {
    const response = await listTopics().expect(200);
    expect(response.body.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: survivorId, activePublicLinkCount: 2, publicLinkCount: 6 }),
        expect.objectContaining({ id: victimId, activePublicLinkCount: 1, publicLinkCount: 3 }),
      ]),
    );
  });

  it('returns HTTP 200 when another connection deletes a topic during active link reads', async () => {
    let deleted = false;
    afterActiveLinkRead = async () => {
      await writer.testTopic.delete({ where: { id: victimId } });
      deleted = true;
    };
    const response = await listTopics();
    expect(deleted).toBe(true);
    expect(response.status).toBe(200);
    expect(response.body.topics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: survivorId, activePublicLinkCount: 2 }),
      ]),
    );
    const nextResponse = await listTopics().expect(200);
    expect(nextResponse.body.topics).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: victimId })]),
    );
  });
});
