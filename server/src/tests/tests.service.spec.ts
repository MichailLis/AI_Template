import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { TestsQuestionService } from './tests-question.service';
import { TestsService } from './tests.service';

jest.mock('./tests-admin-access.utils', () => ({
  ensureTestsAdminAccess: jest.fn().mockResolvedValue(undefined),
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
  let prismaMock: {
    $transaction: jest.Mock;
    analysisPromptVersion: {
      findFirst: jest.Mock;
    };
    testTopic: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    testTopicVersion: {
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
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testTopicVersion: {
        update: jest.fn(),
      },
    };

    service = new TestsService(
      prismaMock as unknown as PrismaService,
      {} as unknown as TestsQuestionService,
    );
    jest.mocked(ensureTestsAdminAccess).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
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

  it('updateTopicDraft rejects missing or unpublished prompt versions', async () => {
    prismaMock.testTopic.findUnique.mockResolvedValue(createTopicSnapshot());
    prismaMock.analysisPromptVersion.findFirst.mockResolvedValue(null);

    await expect(
      service.updateTopicDraft(5, 1, {
        analysisPromptVersionId: 404,
      }),
    ).rejects.toThrow(BadRequestException);
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
    expect(getTopicDraftSpy).toHaveBeenCalledWith(5, 1);
  });
});
