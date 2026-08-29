import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import { TestsPromptSimulationReadService } from '../analysis/prompt-simulation-read.service';

describe('TestsPromptSimulationReadService', () => {
  let service: TestsPromptSimulationReadService;
  let prismaMock: {
    testTopicVersion: {
      findMany: jest.Mock;
    };
    testQuestion: {
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      testTopicVersion: {
        findMany: jest.fn(),
      },
      testQuestion: {
        findMany: jest.fn(),
      },
    };

    service = new TestsPromptSimulationReadService(prismaMock as unknown as PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lists tests and nested questions for prompt simulation', async () => {
    prismaMock.testTopicVersion.findMany.mockResolvedValue([
      {
        id: 31,
        topicId: 12,
        title: 'Career skills',
        description: 'Skills diagnostics',
        versionNumber: 3,
        status: 'DRAFT',
        topic: { slug: 'career-skills' },
        questions: [
          {
            id: 11,
            type: 'OPEN_TEXT',
            title: 'Что вам легче всего дается?',
            description: null,
          },
        ],
      },
    ]);

    await expect(service.listPromptSimulationTests()).resolves.toEqual([
      {
        id: 31,
        topicId: 12,
        topicSlug: 'career-skills',
        title: 'Career skills',
        description: 'Skills diagnostics',
        versionNumber: 3,
        versionStatus: 'DRAFT',
        questionCount: 1,
        questions: [
          {
            id: 11,
            type: 'OPEN_TEXT',
            title: 'Что вам легче всего дается?',
            description: null,
          },
        ],
      },
    ]);
    expect(prismaMock.testTopicVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['DRAFT', 'PUBLISHED'] },
          questions: { some: {} },
        },
      }),
    );
  });

  it('returns selected question payloads for prompt simulation', async () => {
    prismaMock.testQuestion.findMany.mockResolvedValue([
      {
        id: 11,
        type: 'OPEN_TEXT',
        title: 'Что вам легче всего дается?',
        description: null,
        required: true,
        order: 1,
        settings: null,
        options: [],
        sliderBands: [],
      },
    ]);

    await expect(service.getPromptSimulationQuestionPayloads([11, 11])).resolves.toEqual([
      {
        id: 11,
        type: 'OPEN_TEXT',
        title: 'Что вам легче всего дается?',
        description: null,
        required: true,
        order: 1,
        settings: null,
        options: [],
        sliderBands: [],
      },
    ]);
    expect(prismaMock.testQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [11] } },
      }),
    );
  });

  it('rejects missing selected questions', async () => {
    prismaMock.testQuestion.findMany.mockResolvedValue([]);

    await expect(service.getPromptSimulationQuestionPayloads([11])).rejects.toThrow(
      BadRequestException,
    );
  });
});
