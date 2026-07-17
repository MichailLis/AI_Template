import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { TestsQuestionService } from './tests-question.service';
import { TestsService } from './tests.service';

jest.mock('../common/authz/admin-access.utils', () => ({
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

describe('TestsService analysis prompt attachment', () => {
  let service: TestsService;
  let testsQuestionServiceMock: {
    createQuestion: jest.Mock;
    updateQuestion: jest.Mock;
    deleteQuestion: jest.Mock;
    reorderQuestions: jest.Mock;
  };
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
      update: jest.Mock;
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
    testsQuestionServiceMock = {
      createQuestion: jest.fn(),
      updateQuestion: jest.fn(),
      deleteQuestion: jest.fn(),
      reorderQuestions: jest.fn(),
    };
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
        update: jest.fn(),
      },
    };

    service = new TestsService(
      prismaMock as unknown as PrismaService,
      testsQuestionServiceMock as unknown as TestsQuestionService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const expectNoQuestionServiceCalls = () => {
    expect(testsQuestionServiceMock.createQuestion).not.toHaveBeenCalled();
    expect(testsQuestionServiceMock.updateQuestion).not.toHaveBeenCalled();
    expect(testsQuestionServiceMock.deleteQuestion).not.toHaveBeenCalled();
    expect(testsQuestionServiceMock.reorderQuestions).not.toHaveBeenCalled();
  };

  const expectNoPrismaWrites = () => {
    expect(prismaMock.testTopic.update).not.toHaveBeenCalled();
    expect(prismaMock.testTopic.delete).not.toHaveBeenCalled();
    expect(prismaMock.testTopicVersion.update).not.toHaveBeenCalled();
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(txMock.testTopic.create).not.toHaveBeenCalled();
    expect(txMock.testTopic.update).not.toHaveBeenCalled();
    expect(txMock.testTopicVersion.create).not.toHaveBeenCalled();
    expect(txMock.testTopicVersion.update).not.toHaveBeenCalled();
    expect(txMock.testQuestion.create).not.toHaveBeenCalled();
    expect(txMock.testQuestionOption.createMany).not.toHaveBeenCalled();
    expect(txMock.testQuestionSliderBand.createMany).not.toHaveBeenCalled();
  };

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

  it.each([
    [
      'getTopicDraft',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());

        await service.getTopicDraft(5, 1);
      },
    ],
    [
      'createTopic',
      async () => {
        prismaMock.testTopic.findMany.mockResolvedValue([]);
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        txMock.testTopic.create.mockResolvedValue({ id: 1 });
        txMock.testTopicVersion.create.mockResolvedValue({ id: 10 });
        txMock.testTopic.update.mockResolvedValue({});

        await service.createTopic(5, {
          title: 'Career skills',
          description: null,
        });
      },
    ],
    [
      'createTopicFromAi',
      async () => {
        prismaMock.testTopic.findMany.mockResolvedValue([]);
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        txMock.testTopic.create.mockResolvedValue({ id: 1 });
        txMock.testTopicVersion.create.mockResolvedValue({ id: 10 });
        txMock.testTopic.update.mockResolvedValue({});
        txMock.testQuestion.create.mockResolvedValue({ id: 100 });

        await service.createTopicFromAi(5, {
          title: 'Career skills',
          description: null,
          questions: [
            {
              type: 'OPEN_TEXT',
              title: 'What is easy for you?',
              required: true,
            },
          ],
        });
      },
    ],
    [
      'importProfOrientationV3Plus',
      async () => {
        prismaMock.testTopic.findMany.mockResolvedValue([]);
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        txMock.analysisPrompt.findFirst.mockResolvedValue({
          id: 70,
          versions: [{ id: 79 }],
        });
        txMock.testTopic.create.mockResolvedValue({ id: 1 });
        txMock.testTopicVersion.create.mockResolvedValue({ id: 10 });
        txMock.testTopic.update.mockResolvedValue({});
        txMock.testQuestion.create.mockImplementation(({ data }: { data: { order: number } }) =>
          Promise.resolve({ id: data.order }),
        );

        await service.importProfOrientationV3Plus(5);
      },
    ],
    [
      'updateTopicDraft',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        prismaMock.analysisPromptVersion.findFirst.mockResolvedValue(publishedPromptVersion);
        prismaMock.testTopicVersion.update.mockResolvedValue({});

        await service.updateTopicDraft(5, 1, {
          title: 'Updated career skills',
          analysisPromptVersionId: 42,
        });
      },
    ],
    [
      'createQuestion',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        testsQuestionServiceMock.createQuestion.mockResolvedValue(undefined);

        await service.createQuestion(5, 1, {
          type: 'OPEN_TEXT',
          title: 'What is easy for you?',
          required: true,
        });
      },
    ],
    [
      'updateQuestion',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        testsQuestionServiceMock.updateQuestion.mockResolvedValue(undefined);

        await service.updateQuestion(5, 1, 100, {
          type: 'OPEN_TEXT',
          title: 'What is easiest for you?',
          required: true,
        });
      },
    ],
    [
      'deleteQuestion',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        testsQuestionServiceMock.deleteQuestion.mockResolvedValue(undefined);

        await service.deleteQuestion(5, 1, 100);
      },
    ],
    [
      'reorderQuestions',
      async () => {
        prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
        testsQuestionServiceMock.reorderQuestions.mockResolvedValue(undefined);

        await service.reorderQuestions(5, 1, {
          questionIds: [100],
        });
      },
    ],
  ])('%s checks admin access exactly once', async (_name, act) => {
    await act();

    expect(ensureAdminAccess).toHaveBeenCalledTimes(1);
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 5);
  });

  it.each([
    [
      'createQuestion',
      async (accessError: Error) => {
        await expect(
          service.createQuestion(5, 1, {
            type: 'OPEN_TEXT',
            title: 'Blocked question',
            required: true,
          }),
        ).rejects.toBe(accessError);
      },
    ],
    [
      'updateQuestion',
      async (accessError: Error) => {
        await expect(
          service.updateQuestion(5, 1, 100, {
            type: 'OPEN_TEXT',
            title: 'Blocked update',
            required: true,
          }),
        ).rejects.toBe(accessError);
      },
    ],
    [
      'deleteQuestion',
      async (accessError: Error) => {
        await expect(service.deleteQuestion(5, 1, 100)).rejects.toBe(accessError);
      },
    ],
    [
      'reorderQuestions',
      async (accessError: Error) => {
        await expect(
          service.reorderQuestions(5, 1, {
            questionIds: [100],
          }),
        ).rejects.toBe(accessError);
      },
    ],
  ])('%s does not call question writers when admin access is rejected', async (_name, act) => {
    const accessError = new Error('forbidden');
    jest.mocked(ensureAdminAccess).mockRejectedValue(accessError);

    await act(accessError);

    expect(ensureAdminAccess).toHaveBeenCalledTimes(1);
    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 5);
    expectNoQuestionServiceCalls();
    expectNoPrismaWrites();
  });

  it('does not write when admin access is rejected before updating a draft', async () => {
    const accessError = new Error('forbidden');
    jest.mocked(ensureAdminAccess).mockRejectedValue(accessError);

    await expect(
      service.updateTopicDraft(5, 1, {
        title: 'Blocked update',
      }),
    ).rejects.toThrow(accessError);

    expectNoPrismaWrites();
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
    const getTopicDraftSpy = jest.spyOn(service, 'getTopicDraft').mockResolvedValue({
      topicId: 1,
      slug: 'prof-orientation-v3-plus',
      draft: {
        id: 10,
        versionNumber: 1,
        title: 'Профориентационный тест v3+',
        description: null,
        analysisPromptVersion: null,
        questions: [],
      },
      published: null,
    });

    await service.importProfOrientationV3Plus(5);

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
    expect(getTopicDraftSpy).not.toHaveBeenCalled();
    expect(prismaMock.testTopic.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: expect.any(Object) as unknown,
    });
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
    jest.spyOn(service, 'getTopicDraft').mockResolvedValue({
      topicId: 1,
      slug: 'prof-orientation-v3-plus',
      draft: {
        id: 10,
        versionNumber: 1,
        title: 'Профориентационный тест v3+',
        description: null,
        analysisPromptVersion: null,
        questions: [],
      },
      published: null,
    });

    await service.importProfOrientationV3Plus(5);

    expect(txMock.analysisPromptVersion.create).not.toHaveBeenCalled();
    expect(txMock.testTopicVersion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        analysisPromptVersionId: 79,
      }) as unknown,
    });
  });
});
