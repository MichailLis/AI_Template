import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma.service';
import { AnalysisPromptsService } from './analysis-prompts.service';
import { ensureAdminAccess } from './admin-access.utils';
import { generateOpenRouterPrompt } from './openrouter.client';
import { TestAnalysisResultJsonSchema } from '../tests/dto/tests-analysis.dto';

type PublishVersionUpdate = (args: {
  data: { status: string; publishedAt: Date };
  where: { id: number };
}) => Promise<unknown>;

jest.mock('./admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('./openrouter.client', () => ({
  generateOpenRouterPrompt: jest.fn(),
}));

describe('AnalysisPromptsService', () => {
  let service: AnalysisPromptsService;
  let prismaMock: {
    analysisPrompt: {
      findMany: jest.Mock;
      create: jest.Mock;
    };
    analysisPromptVersion: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    testQuestion: {
      findMany: jest.Mock;
    };
  };
  let configMock: {
    get: jest.Mock;
  };

  const promptRecord = {
    id: 7,
    title: 'Career guidance analysis',
    description: 'Analyzes completed tests.',
    createdAt: new Date('2026-05-01T10:00:00.000Z'),
    updatedAt: new Date('2026-05-01T10:05:00.000Z'),
    versions: [
      {
        id: 42,
        promptId: 7,
        versionNumber: 1,
        status: 'DRAFT',
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.2,
        prompt: 'Analyze {{answers}}',
        outputSchema: TestAnalysisResultJsonSchema,
        publishedAt: null,
        createdAt: new Date('2026-05-01T10:00:00.000Z'),
        updatedAt: new Date('2026-05-01T10:05:00.000Z'),
      },
    ],
  };

  beforeEach(() => {
    prismaMock = {
      analysisPrompt: {
        findMany: jest.fn(),
        create: jest.fn(),
      },
      analysisPromptVersion: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testQuestion: {
        findMany: jest.fn(),
      },
    };
    configMock = {
      get: jest.fn((key: string) => (key === 'OPENROUTER_API_KEY' ? 'test-key' : undefined)),
    };

    service = new AnalysisPromptsService(
      prismaMock as unknown as PrismaService,
      configMock as unknown as ConfigService,
    );
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);
    jest.mocked(generateOpenRouterPrompt).mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('listPrompts returns prompts with version metadata', async () => {
    prismaMock.analysisPrompt.findMany.mockResolvedValue([promptRecord]);

    const result = await service.listPrompts(3);

    expect(ensureAdminAccess).toHaveBeenCalledWith(prismaMock, 3);
    expect(result.prompts[0]?.versions[0]).toMatchObject({
      id: 42,
      promptId: 7,
      status: 'DRAFT',
      model: 'google/gemini-2.0-flash-exp:free',
    });
  });

  it('createPrompt creates a prompt with first draft version and fixed output schema', async () => {
    prismaMock.analysisPrompt.create.mockResolvedValue(promptRecord);

    await service.createPrompt(3, {
      title: 'Career guidance analysis',
      description: 'Analyzes completed tests.',
      model: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.2,
      prompt: 'Analyze {{answers}}',
    });

    expect(prismaMock.analysisPrompt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          title: 'Career guidance analysis',
          description: 'Analyzes completed tests.',
          versions: {
            create: {
              versionNumber: 1,
              status: 'DRAFT',
              model: 'google/gemini-2.0-flash-exp:free',
              temperature: 0.2,
              prompt: 'Analyze {{answers}}',
              outputSchema: TestAnalysisResultJsonSchema,
            },
          },
        },
      }),
    );
  });

  it('createPrompt rejects non-free models before persistence', async () => {
    await expect(
      service.createPrompt(3, {
        title: 'Career guidance analysis',
        description: 'Analyzes completed tests.',
        model: 'openai/gpt-4.1',
        temperature: 0.2,
        prompt: 'Analyze {{answers}}',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.analysisPrompt.create).not.toHaveBeenCalled();
  });

  it('publishVersion marks an existing draft as published', async () => {
    prismaMock.analysisPromptVersion.findUnique.mockResolvedValue({
      id: 42,
      status: 'DRAFT',
    });
    prismaMock.analysisPromptVersion.update.mockResolvedValue({
      ...promptRecord.versions[0],
      status: 'PUBLISHED',
      publishedAt: new Date('2026-05-01T10:10:00.000Z'),
    });

    await expect(service.publishVersion(3, 42)).resolves.toMatchObject({
      version: {
        status: 'PUBLISHED',
      },
    });

    const updateMock = prismaMock.analysisPromptVersion
      .update as jest.MockedFunction<PublishVersionUpdate>;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.where.id).toBe(42);
    expect(updateArgs?.data.status).toBe('PUBLISHED');
  });

  it('publishVersion throws NotFoundException when version does not exist', async () => {
    prismaMock.analysisPromptVersion.findUnique.mockResolvedValue(null);

    await expect(service.publishVersion(3, 404)).rejects.toThrow(NotFoundException);
  });

  it('simulatePrompt generates synthetic answers and runs structured analysis with selected questions', async () => {
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
    jest
      .mocked(generateOpenRouterPrompt)
      .mockResolvedValueOnce({
        model: 'google/gemini-2.0-flash-exp:free',
        output: JSON.stringify({
          answers: [{ questionId: 11, answer: 'Мне легко структурировать задачи.' }],
        }),
      })
      .mockResolvedValueOnce({
        model: 'google/gemini-2.0-flash-exp:free',
        output: JSON.stringify({ skillsLevel: { title: 'ok' } }),
      });

    const result = await service.simulatePrompt(3, {
      prompt: 'Analyze selected answers',
      model: 'google/gemini-2.0-flash-exp:free',
      temperature: 0.2,
      questionIds: [11],
      generateAnswers: true,
    });

    expect(prismaMock.testQuestion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: [11] } },
      }),
    );
    expect(generateOpenRouterPrompt).toHaveBeenCalledTimes(2);
    expect(jest.mocked(generateOpenRouterPrompt).mock.calls[1]?.[2]).toMatchObject({
      model: 'google/gemini-2.0-flash-exp:free',
      responseFormat: 'json',
      responseSchema: TestAnalysisResultJsonSchema,
      requireParameters: true,
      useResponseHealing: true,
    });
    expect(result.questionCount).toBe(1);
    expect(result.syntheticAnswers).toEqual({
      answers: [{ questionId: 11, answer: 'Мне легко структурировать задачи.' }],
    });
  });

  it('simulatePrompt rejects non-free models before OpenRouter call', async () => {
    await expect(
      service.simulatePrompt(3, {
        prompt: 'Analyze selected answers',
        model: 'openai/gpt-4.1',
        temperature: 0.2,
        questionIds: [11],
        generateAnswers: true,
      }),
    ).rejects.toThrow(BadRequestException);
    expect(generateOpenRouterPrompt).not.toHaveBeenCalled();
  });

  it('simulatePrompt fails fast when OpenRouter key is missing', async () => {
    configMock.get.mockReturnValue(undefined);

    await expect(
      service.simulatePrompt(3, {
        prompt: 'Analyze selected answers',
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.2,
        questionIds: [11],
        generateAnswers: true,
      }),
    ).rejects.toThrow(ServiceUnavailableException);
  });

  it('listTestQuestions returns selectable questions from test versions', async () => {
    prismaMock.testQuestion.findMany.mockResolvedValue([
      {
        id: 11,
        type: 'OPEN_TEXT',
        title: 'Что вам легче всего дается?',
        description: null,
        version: {
          versionNumber: 3,
          status: 'DRAFT',
          title: 'Career skills',
        },
      },
    ]);

    const result = await service.listTestQuestions(3);

    expect(prismaMock.testQuestion.findMany).toHaveBeenCalled();
    expect(result.questions).toEqual([
      {
        id: 11,
        type: 'OPEN_TEXT',
        title: 'Что вам легче всего дается?',
        description: null,
        topicTitle: 'Career skills',
        versionNumber: 3,
        versionStatus: 'DRAFT',
      },
    ]);
  });
});
