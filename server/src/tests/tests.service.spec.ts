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
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    testTopicVersion: {
      update: jest.Mock;
    };
  };
  let txMock: {
    testTopic: {
      update: jest.Mock;
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
        update: jest.fn(),
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
      },
    });
  });
});
