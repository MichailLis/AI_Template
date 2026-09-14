import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma.service';

const MIGRATION_NAME = '20260912000000_archive_superseded_published_prompt_versions';

class RollbackSentinel extends Error {}

type VersionState = { versionNumber: number; status: string };

/**
 * До правки FLOW-02 публикация версии промпта не архивировала прежнюю, и в базах накопились промпты
 * с несколькими PUBLISHED-версиями. Миграция данных оставляет опубликованной только старшую.
 *
 * Миграция глобальная, поэтому проверка идёт внутри транзакции с откатом: иначе тест заодно
 * менял бы настоящие данные базы, на которой запущен.
 */
describe('Prompt version normalisation migration (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const suffix = Date.now();
  const promptTitlePrefix = `normalisation-e2e-${suffix}`;
  const topicSlug = `normalisation-e2e-${suffix}`;
  const migrationSql = () =>
    readFileSync(join(__dirname, '../prisma/migrations', MIGRATION_NAME, 'migration.sql'), 'utf8');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('keeps only the newest published version of each prompt and leaves test bindings alone', async () => {
    const sql = migrationSql();
    let observed:
      | {
          promptA: VersionState[];
          promptB: VersionState[];
          promptC: VersionState[];
          boundVersionId: number | null;
          promptAv1Id: number;
          rowsOnSecondRun: number;
        }
      | undefined;

    const createPrompt = (
      tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
      label: string,
      versions: VersionState[],
    ) =>
      tx.analysisPrompt.create({
        data: {
          title: `${promptTitlePrefix}-${label}`,
          versions: {
            create: versions.map((version) => ({
              versionNumber: version.versionNumber,
              status: version.status as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
              model: 'openai/gpt-oss-120b',
              prompt: 'Analyze',
            })),
          },
        },
        include: { versions: { orderBy: { versionNumber: 'asc' } } },
      });

    const readVersions = async (
      tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
      promptId: number,
    ) =>
      (
        await tx.analysisPromptVersion.findMany({
          where: { promptId },
          orderBy: { versionNumber: 'asc' },
          select: { versionNumber: true, status: true },
        })
      ).map((version) => ({ versionNumber: version.versionNumber, status: version.status }));

    await expect(
      prisma.$transaction(async (tx) => {
        const promptA = await createPrompt(tx, 'a', [
          { versionNumber: 1, status: 'PUBLISHED' },
          { versionNumber: 2, status: 'PUBLISHED' },
          { versionNumber: 3, status: 'DRAFT' },
        ]);
        const promptB = await createPrompt(tx, 'b', [{ versionNumber: 1, status: 'PUBLISHED' }]);
        const promptC = await createPrompt(tx, 'c', [
          { versionNumber: 1, status: 'ARCHIVED' },
          { versionNumber: 2, status: 'PUBLISHED' },
        ]);
        const promptAv1Id = promptA.versions[0]!.id;

        const topic = await tx.testTopic.create({
          data: {
            slug: topicSlug,
            versions: {
              create: {
                versionNumber: 1,
                title: 'Normalisation binding',
                analysisPromptVersionId: promptAv1Id,
              },
            },
          },
          include: { versions: true },
        });

        await tx.$executeRawUnsafe(sql);
        const rowsOnSecondRun = await tx.$executeRawUnsafe(sql);

        const boundVersion = await tx.testTopicVersion.findUnique({
          where: { id: topic.versions[0]!.id },
          select: { analysisPromptVersionId: true },
        });

        observed = {
          promptA: await readVersions(tx, promptA.id),
          promptB: await readVersions(tx, promptB.id),
          promptC: await readVersions(tx, promptC.id),
          boundVersionId: boundVersion?.analysisPromptVersionId ?? null,
          promptAv1Id,
          rowsOnSecondRun,
        };

        throw new RollbackSentinel('roll back the migration check');
      }),
    ).rejects.toBeInstanceOf(RollbackSentinel);

    expect(observed).toBeDefined();
    expect(observed!.promptA).toEqual([
      { versionNumber: 1, status: 'ARCHIVED' },
      { versionNumber: 2, status: 'PUBLISHED' },
      { versionNumber: 3, status: 'DRAFT' },
    ]);
    expect(observed!.promptB).toEqual([{ versionNumber: 1, status: 'PUBLISHED' }]);
    expect(observed!.promptC).toEqual([
      { versionNumber: 1, status: 'ARCHIVED' },
      { versionNumber: 2, status: 'PUBLISHED' },
    ]);
    expect(observed!.boundVersionId).toBe(observed!.promptAv1Id);
    expect(observed!.rowsOnSecondRun).toBe(0);

    await expect(
      prisma.analysisPrompt.count({ where: { title: { startsWith: promptTitlePrefix } } }),
    ).resolves.toBe(0);
  });
});
