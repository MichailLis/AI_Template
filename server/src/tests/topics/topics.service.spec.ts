import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import { ensureAdminAccess } from '../../common/authz/admin-access.utils';
import { TestsQuestionService } from '../topics/question.service';
import { TestsService } from '../topics/topics.service';

jest.mock('../../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

const publishedPromptVersion = {
  id: 42,
  promptId: 7,
  versionNumber: 2,
  status: 'PUBLISHED',
  model: 'google/gemini-2.0-flash-exp:free',
  analysisPrompt: {
    id: 7,
    title: 'Career analysis',
  },
};

const createTopicSnapshot = () => ({
  id: 1,
  slug: 'career-skills',
  activePublishedVersionId: null,
  activeDraftVersion: {
    id: 10,
    topicId: 1,
    versionNumber: 3,
    status: 'DRAFT',
    title: 'Career skills',
    description: null,
    analysisPromptVersionId: 42,
    analysisPromptVersion: publishedPromptVersion,
    scoringKind: 'PROF_ORIENTATION_V3_PLUS',
    scoringConfig: {
      version: '3.0',
      directions: ['A1', 'A2'],
    },
    questions: [
      {
        id: 100,
        type: 'OPEN_TEXT',
        title: 'Что вам легче всего дается?',
        description: null,
        required: true,
        order: 1,
        settings: null,
        options: [],
        sliderBands: [],
      },
    ],
  },
  activePublishedVersion: null,
});

const listedQuestion = {
  type: 'SINGLE_CHOICE',
  title: 'Что вам ближе?',
  description: null,
  required: true,
  order: 1,
  settings: null,
  options: [{ label: 'Техника', value: 'tech', weight: 1, order: 1 }],
  sliderBands: [],
};

/** Версия в том виде, в каком ее выбирает список тестов: номер, счетчик и сравниваемое содержимое. */
const createListedVersion = (overrides: Record<string, unknown> = {}) => ({
  id: 10,
  versionNumber: 1,
  title: 'Career skills',
  description: 'Навыки для карьеры',
  analysisPromptVersionId: 42,
  scoringKind: 'DEFAULT',
  scoringConfig: null,
  _count: { questions: 1 },
  questions: [listedQuestion],
  ...overrides,
});

describe('TestsService analysis prompt attachment', () => {
  let service: TestsService;
  let prismaMock: {
    $transaction: jest.Mock;
    analysisPromptVersion: {
      findFirst: jest.Mock;
    };
    testTopic: {
      delete: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    testTopicVersion: {
      count: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
    testPublicLink: {
      findMany: jest.Mock;
    };
  };
  let txMock: {
    testTopic: {
      create: jest.Mock;
      update: jest.Mock;
    };
    analysisPrompt: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    analysisPromptVersion: {
      create: jest.Mock;
      findFirst: jest.Mock;
    };
    testTopicVersion: {
      create: jest.Mock;
      update: jest.Mock;
    };
    testQuestion: {
      create: jest.Mock;
    };
    testQuestionOption: {
      createMany: jest.Mock;
    };
    testQuestionSliderBand: {
      createMany: jest.Mock;
    };
  };

  beforeEach(() => {
    txMock = {
      testTopic: {
        create: jest.fn(),
        update: jest.fn(),
      },
      analysisPrompt: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      analysisPromptVersion: {
        create: jest.fn(),
        findFirst: jest.fn(),
      },
      testTopicVersion: {
        create: jest.fn(),
        update: jest.fn(),
      },
      testQuestion: {
        create: jest.fn(),
      },
      testQuestionOption: {
        createMany: jest.fn(),
      },
      testQuestionSliderBand: {
        createMany: jest.fn(),
      },
    };
    prismaMock = {
      $transaction: jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock)),
      analysisPromptVersion: {
        findFirst: jest.fn(),
      },
      testTopic: {
        delete: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testTopicVersion: {
        count: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
      testPublicLink: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    service = new TestsService(
      prismaMock as unknown as PrismaService,
      {} as unknown as TestsQuestionService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listTopics reports how many active public links each test has', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([
      {
        id: 1,
        slug: 'career-skills',
        updatedAt: new Date('2026-09-11T10:00:00.000Z'),
        activeDraftVersion: createListedVersion({ id: 10, versionNumber: 3 }),
        activePublishedVersion: createListedVersion({ id: 9, versionNumber: 2 }),
      },
      {
        id: 2,
        slug: 'no-links',
        updatedAt: new Date('2026-09-11T09:00:00.000Z'),
        activeDraftVersion: createListedVersion({
          id: 20,
          title: 'No links',
          _count: { questions: 0 },
          questions: [],
        }),
        activePublishedVersion: null,
      },
    ]);
    prismaMock.testPublicLink.findMany.mockResolvedValue([
      { topicVersion: { topicId: 1 } },
      { topicVersion: { topicId: 1 } },
    ]);

    const result = await service.listTopics(5);

    expect(prismaMock.testPublicLink.findMany).toHaveBeenCalledWith({
      where: {
        archivedAt: null,
        isActive: true,
        topicVersion: {
          topicId: {
            in: [1, 2],
          },
        },
      },
      select: {
        topicVersion: {
          select: {
            topicId: true,
          },
        },
      },
    });
    expect(result.topics.map((topic) => [topic.id, topic.activePublicLinkCount])).toEqual([
      [1, 2],
      [2, 0],
    ]);
  });

  it('does not query public links when no topic matches the list filter', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([]);

    const result = await service.listTopics(5);

    expect(result.topics).toEqual([]);
    expect(prismaMock.testPublicLink.findMany).not.toHaveBeenCalled();
    expect(prismaMock.testTopicVersion.findMany).not.toHaveBeenCalled();
  });

  /**
   * Находка аудита UX-03: одноименные тесты отличались только временем обновления, а «Черновик v2»
   * стоял у каждого опубликованного теста, потому что публикация всегда клонирует черновик. Строке
   * нужны описание, число прохождений и признак реальных неопубликованных изменений.
   */
  it('listTopics flags unpublished changes only when the draft differs from the published version', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([
      {
        id: 1,
        slug: 'untouched',
        updatedAt: new Date('2026-09-11T10:00:00.000Z'),
        activeDraftVersion: createListedVersion({ id: 11, versionNumber: 2 }),
        activePublishedVersion: createListedVersion({ id: 10, versionNumber: 1 }),
      },
      {
        id: 2,
        slug: 'edited',
        updatedAt: new Date('2026-09-11T09:00:00.000Z'),
        activeDraftVersion: createListedVersion({
          id: 21,
          versionNumber: 2,
          questions: [{ ...listedQuestion, title: 'Что вам интереснее?' }],
        }),
        activePublishedVersion: createListedVersion({ id: 20, versionNumber: 1 }),
      },
      {
        id: 3,
        slug: 'draft-only',
        updatedAt: new Date('2026-09-11T08:00:00.000Z'),
        activeDraftVersion: createListedVersion({ id: 30, description: null }),
        activePublishedVersion: null,
      },
    ]);
    prismaMock.testTopicVersion.findMany.mockResolvedValue([
      { topicId: 1, _count: { studentAttempts: 3 } },
      { topicId: 1, _count: { studentAttempts: 2 } },
      { topicId: 2, _count: { studentAttempts: 1 } },
    ]);

    const result = await service.listTopics(5);

    expect(
      result.topics.map((topic) => [
        topic.slug,
        topic.hasUnpublishedChanges,
        topic.attemptCount,
        topic.description,
      ]),
    ).toEqual([
      ['untouched', false, 5, 'Навыки для карьеры'],
      ['edited', true, 1, 'Навыки для карьеры'],
      ['draft-only', false, 0, null],
    ]);
  });

  /**
   * Находка аудита FLOW-04: меню предлагало «Удалить навсегда» для любого архивного теста, а
   * сервер отказывал тестам с публикацией, ссылками или прохождениями — узнать это можно было
   * только после попытки. Список отдает возможность удаления по тому же правилу, что deleteTopic.
   */
  it('listTopics says whether a test can be deleted, by the same rule as deleteTopic', async () => {
    const updatedAt = new Date('2026-09-11T10:00:00.000Z');
    prismaMock.testTopic.findMany.mockResolvedValue([
      {
        id: 1,
        slug: 'published',
        updatedAt,
        activeDraftVersion: createListedVersion({ id: 11, versionNumber: 2 }),
        activePublishedVersion: createListedVersion({ id: 10, versionNumber: 1 }),
      },
      {
        id: 2,
        slug: 'linked-draft',
        updatedAt,
        activeDraftVersion: createListedVersion({ id: 20 }),
        activePublishedVersion: null,
      },
      {
        id: 3,
        slug: 'unused-draft',
        updatedAt,
        activeDraftVersion: createListedVersion({ id: 30 }),
        activePublishedVersion: null,
      },
    ]);
    prismaMock.testTopicVersion.findMany.mockResolvedValue([
      { topicId: 1, status: 'PUBLISHED', _count: { studentAttempts: 0, publicLinks: 0 } },
      { topicId: 1, status: 'DRAFT', _count: { studentAttempts: 0, publicLinks: 0 } },
      { topicId: 2, status: 'DRAFT', _count: { studentAttempts: 0, publicLinks: 1 } },
      { topicId: 3, status: 'DRAFT', _count: { studentAttempts: 0, publicLinks: 0 } },
    ]);

    const result = await service.listTopics(5);

    expect(
      result.topics.map((topic) => [
        topic.slug,
        topic.canDelete,
        topic.hasPublishedVersion,
        topic.publicLinkCount,
      ]),
    ).toEqual([
      ['published', false, true, 0],
      ['linked-draft', false, false, 1],
      ['unused-draft', true, false, 0],
    ]);
  });

  /**
   * Находка аудита FLOW-03: «Импорт v3+» создавал очередную копию методики, не упоминая
   * существующие. Копии узнаются по виду подсчета черновика, а не по названию, которое можно менять.
   */
  it('listTopics exposes the scoring kind of the draft so methodology copies can be found', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([
      {
        id: 1,
        slug: 'prof-orientation-v3-plus',
        updatedAt: new Date('2026-09-11T10:00:00.000Z'),
        activeDraftVersion: createListedVersion({ scoringKind: 'PROF_ORIENTATION_V3_PLUS' }),
        activePublishedVersion: null,
      },
      {
        id: 2,
        slug: 'career-skills',
        updatedAt: new Date('2026-09-11T10:00:00.000Z'),
        activeDraftVersion: createListedVersion({ id: 20 }),
        activePublishedVersion: null,
      },
    ]);
    prismaMock.testTopicVersion.findMany.mockResolvedValue([]);

    const result = await service.listTopics(5);

    expect(result.topics.map((topic) => [topic.slug, topic.scoringKind])).toEqual([
      ['prof-orientation-v3-plus', 'PROF_ORIENTATION_V3_PLUS'],
      ['career-skills', 'DEFAULT'],
    ]);
  });

  it('getTopicDraft returns selected analysis prompt version summary', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());

    const result = await service.getTopicDraft(5, 1);

    expect(result.draft.analysisPromptVersion).toEqual({
      id: 42,
      promptId: 7,
      promptTitle: 'Career analysis',
      versionNumber: 2,
      model: 'google/gemini-2.0-flash-exp:free',
    });
  });

  it('updateTopicDraft attaches a published prompt version to the active draft', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
    prismaMock.analysisPromptVersion.findFirst.mockResolvedValue(publishedPromptVersion);

    await service.updateTopicDraft(5, 1, {
      analysisPromptVersionId: 42,
    });

    expect(prismaMock.analysisPromptVersion.findFirst).toHaveBeenCalledWith({
      where: {
        id: 42,
        status: 'PUBLISHED',
      },
      select: { id: true },
    });
    expect(prismaMock.testTopicVersion.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: {
        title: 'Career skills',
        description: null,
        analysisPromptVersionId: 42,
      },
    });
  });

  // updateTopicDraft used to return through getTopicDraft, which runs the check again. The check
  // is a prisma.user.findUnique, so every topic and question mutation paid for two.
  it('updateTopicDraft checks admin access once, not once per response build', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
    prismaMock.testTopicVersion.update.mockResolvedValue({});

    await service.updateTopicDraft(5, 1, { title: 'Career skills' });

    expect(jest.mocked(ensureAdminAccess)).toHaveBeenCalledTimes(1);
  });

  it('updateTopicDraft rejects missing or unpublished prompt versions', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
    prismaMock.analysisPromptVersion.findFirst.mockResolvedValue(null);

    await expect(
      service.updateTopicDraft(5, 1, {
        analysisPromptVersionId: 404,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('deleteTopic refuses to delete topics with published versions, public links, or attempts', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.testTopicVersion.count.mockResolvedValue(1);

    await expect(service.deleteTopic(5, 1)).rejects.toThrow(BadRequestException);

    expect(prismaMock.testTopicVersion.count).toHaveBeenCalledWith({
      where: {
        topicId: 1,
        OR: [
          { status: 'PUBLISHED' },
          { publicLinks: { some: {} } },
          { studentAttempts: { some: {} } },
        ],
      },
    });
    expect(prismaMock.testTopic.delete).not.toHaveBeenCalled();
  });

  it('deleteTopic hard-deletes draft-only unused topics', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.testTopicVersion.count.mockResolvedValue(0);
    prismaMock.testTopic.delete.mockResolvedValue({});

    await expect(service.deleteTopic(5, 1)).resolves.toEqual({ topicId: 1 });

    expect(prismaMock.testTopic.delete).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it('publishTopic carries selected prompt version into the next draft', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
    txMock.testTopicVersion.update.mockResolvedValue({});
    txMock.testTopicVersion.create.mockResolvedValue({
      id: 11,
      versionNumber: 4,
    });
    txMock.testQuestion.create.mockResolvedValue({ id: 1000 });

    await service.publishTopic(5, 1);

    expect(txMock.testTopicVersion.create).toHaveBeenCalledWith({
      data: {
        topicId: 1,
        versionNumber: 4,
        status: 'DRAFT',
        title: 'Career skills',
        description: null,
        analysisPromptVersionId: 42,
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        scoringConfig: {
          version: '3.0',
          directions: ['A1', 'A2'],
        },
      },
    });
  });

  it('importProfOrientationV3Plus creates a full Polus draft with scoring config', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([]);
    txMock.analysisPrompt.findFirst.mockResolvedValue(null);
    txMock.analysisPrompt.create.mockResolvedValue({ id: 70 });
    txMock.analysisPromptVersion.create.mockResolvedValue({ id: 80 });
    txMock.testTopic.create.mockResolvedValue({ id: 1 });
    txMock.testTopicVersion.create.mockResolvedValue({
      id: 10,
      versionNumber: 1,
    });
    txMock.testQuestion.create.mockImplementation(({ data }: { data: { order: number } }) =>
      Promise.resolve({ id: data.order }),
    );
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());

    const result = await service.importProfOrientationV3Plus(5);

    expect(txMock.testTopicVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Профориентационный тест v3+',
        analysisPromptVersionId: 80,
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        scoringConfig: expect.objectContaining({
          version: '3.0',
        }) as unknown,
      }) as unknown,
    });
    expect(txMock.testQuestion.create).toHaveBeenCalledTimes(21);
    expect(txMock.testQuestionOption.createMany).toHaveBeenCalledTimes(10);
    expect(txMock.testQuestionSliderBand.createMany).toHaveBeenCalledTimes(11);
    expect(result.topicId).toBe(1);
    expect(result.draft.id).toBe(10);
  });

  it('importProfOrientationV3Plus reuses the latest published prompt version model selected in UI', async () => {
    prismaMock.testTopic.findMany.mockResolvedValue([]);
    txMock.analysisPrompt.findFirst.mockResolvedValue({
      id: 70,
      versions: [
        {
          id: 79,
          versionNumber: 1,
          status: 'PUBLISHED',
          model: 'google/gemini-2.0-flash-exp:free',
        },
      ],
    });
    txMock.testTopic.create.mockResolvedValue({ id: 1 });
    txMock.testTopicVersion.create.mockResolvedValue({
      id: 10,
      versionNumber: 1,
    });
    txMock.testQuestion.create.mockImplementation(({ data }: { data: { order: number } }) =>
      Promise.resolve({ id: data.order }),
    );
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());

    await service.importProfOrientationV3Plus(5);

    expect(txMock.analysisPromptVersion.create).not.toHaveBeenCalled();
    expect(txMock.testTopicVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisPromptVersionId: 79,
      }) as unknown,
    });
  });
});
