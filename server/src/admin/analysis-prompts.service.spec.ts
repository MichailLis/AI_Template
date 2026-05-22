import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../prisma.service';
import { AnalysisPromptsService } from './analysis-prompts.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { generateOpenRouterPrompt } from '../openrouter/openrouter.client';
import { TestAnalysisResultJsonSchema } from '../tests/dto/tests-analysis.dto';

type PublishVersionUpdate = (args: {
  data: { status: string; publishedAt: Date };
  where: { id: number };
}) => Promise<unknown>;

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../openrouter/openrouter.client', () => ({
  generateOpenRouterPrompt: jest.fn(),
}));

describe('AnalysisPromptsService', () => {
  let service: AnalysisPromptsService;
  let prismaMock: {
    analysisPrompt: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    analysisPromptVersion: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    testTopicVersion: {
      findMany: jest.Mock;
    };
    testQuestion: {
      findMany: jest.Mock;
    };
  };
  let configMock: {
    get: jest.Mock;
  };
  let openRouterApiKeyServiceMock: {
    getOpenRouterApiKey: jest.Mock;
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
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      analysisPromptVersion: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testTopicVersion: {
        findMany: jest.fn(),
      },
      testQuestion: {
        findMany: jest.fn(),
      },
    };
    configMock = {
      get: jest.fn((key: string) => (key === 'OPENROUTER_API_KEY' ? 'test-key' : undefined)),
    };
    openRouterApiKeyServiceMock = {
      getOpenRouterApiKey: jest.fn().mockResolvedValue('test-key'),
    };

    service = new AnalysisPromptsService(
      prismaMock as unknown as PrismaService,
      configMock as unknown as ConfigService,
      openRouterApiKeyServiceMock as unknown as OpenRouterApiKeyService,
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

  it('createPrompt allows paid structured output models', async () => {
    prismaMock.analysisPrompt.create.mockResolvedValue({
      ...promptRecord,
      versions: [
        {
          ...promptRecord.versions[0],
          model: 'openai/gpt-4.1',
        },
      ],
    });

    await service.createPrompt(3, {
      title: 'Career guidance analysis',
      description: 'Analyzes completed tests.',
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      prompt: 'Analyze {{answers}}',
    });

    const createCalls = prismaMock.analysisPrompt.create.mock.calls as unknown as Array<
      [
        {
          data: {
            versions: {
              create: {
                model: string;
              };
            };
          };
        },
      ]
    >;
    const createArg = createCalls[0]?.[0];
    expect(createArg?.data.versions.create.model).toBe('openai/gpt-4.1');
  });

  it('updatePrompt creates the next draft version and updates prompt metadata', async () => {
    prismaMock.analysisPrompt.findUnique.mockResolvedValue(promptRecord);
    prismaMock.analysisPrompt.update.mockResolvedValue({
      ...promptRecord,
      title: 'Updated career analysis',
      description: 'Updated description',
      versions: [
        {
          ...promptRecord.versions[0],
          id: 43,
          versionNumber: 2,
          model: 'openai/gpt-4.1',
          temperature: 0.4,
          prompt: 'Updated prompt',
        },
        promptRecord.versions[0],
      ],
    });

    const result = await service.updatePrompt(3, 7, {
      title: ' Updated career analysis ',
      description: ' Updated description ',
      model: ' openai/gpt-4.1 ',
      temperature: 0.4,
      prompt: ' Updated prompt ',
    });

    expect(result.prompt).toMatchObject({
      id: 7,
      title: 'Updated career analysis',
    });
    expect(result.prompt.versions[0]).toMatchObject({
      versionNumber: 2,
      model: 'openai/gpt-4.1',
      prompt: 'Updated prompt',
    });

    expect(prismaMock.analysisPrompt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 7 },
        data: {
          title: 'Updated career analysis',
          description: 'Updated description',
          versions: {
            create: {
              versionNumber: 2,
              status: 'DRAFT',
              model: 'openai/gpt-4.1',
              temperature: 0.4,
              prompt: 'Updated prompt',
              outputSchema: TestAnalysisResultJsonSchema,
            },
          },
        },
      }),
    );
  });

  it('updatePrompt throws NotFoundException when prompt is archived or missing', async () => {
    prismaMock.analysisPrompt.findUnique.mockResolvedValue(null);

    await expect(
      service.updatePrompt(3, 404, {
        title: 'Updated career analysis',
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('deletePrompt archives an existing prompt without removing versions', async () => {
    prismaMock.analysisPrompt.findUnique.mockResolvedValue(promptRecord);
    prismaMock.analysisPrompt.update.mockResolvedValue({
      ...promptRecord,
      archivedAt: new Date('2026-05-01T11:00:00.000Z'),
    });

    await expect(service.deletePrompt(3, 7)).resolves.toMatchObject({
      prompt: {
        id: 7,
        title: 'Career guidance analysis',
      },
    });

    const updateCalls = prismaMock.analysisPrompt.update.mock.calls as unknown as Array<
      [
        {
          data: { archivedAt: Date };
          where: { id: number };
        },
      ]
    >;
    const updateArg = updateCalls[0]?.[0];
    expect(updateArg?.where).toEqual({ id: 7 });
    expect(updateArg?.data.archivedAt).toBeInstanceOf(Date);
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

  it('simulatePrompt allows paid structured output models', async () => {
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
        model: 'openai/gpt-4.1',
        output: JSON.stringify({
          answers: [{ questionId: 11, answer: 'Мне легко структурировать задачи.' }],
        }),
      })
      .mockResolvedValueOnce({
        model: 'openai/gpt-4.1',
        output: JSON.stringify({ skillsLevel: { title: 'ok' } }),
      });

    await service.simulatePrompt(3, {
      prompt: 'Analyze selected answers',
      model: 'openai/gpt-4.1',
      temperature: 0.2,
      questionIds: [11],
      generateAnswers: true,
    });

    expect(generateOpenRouterPrompt).toHaveBeenCalledTimes(2);
    expect(jest.mocked(generateOpenRouterPrompt).mock.calls[1]?.[2]).toMatchObject({
      model: 'openai/gpt-4.1',
      responseFormat: 'json',
    });
  });

  it('simulatePrompt fails fast when OpenRouter key is missing', async () => {
    openRouterApiKeyServiceMock.getOpenRouterApiKey.mockRejectedValue(
      new ServiceUnavailableException('OPENROUTER_API_KEY is not configured on server'),
    );

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

  it('listTestQuestions returns selectable tests with all nested questions per version', async () => {
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
          {
            id: 12,
            type: 'SINGLE_CHOICE',
            title: 'Как вы реагируете на изменения?',
            description: 'Выберите один вариант.',
          },
        ],
      },
      {
        id: 32,
        topicId: 13,
        title: 'Soft skills',
        description: null,
        versionNumber: 1,
        status: 'PUBLISHED',
        topic: { slug: 'soft-skills' },
        questions: [
          {
            id: 21,
            type: 'SLIDER',
            title: 'Насколько комфортна коммуникация?',
            description: null,
          },
        ],
      },
    ]);

    const result = await service.listTestQuestions(3);

    expect(prismaMock.testTopicVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          status: { in: ['DRAFT', 'PUBLISHED'] },
          questions: { some: {} },
        },
      }),
    );
    expect(prismaMock.testQuestion.findMany).not.toHaveBeenCalled();
    expect(result.tests).toEqual([
      {
        id: 31,
        topicId: 12,
        topicSlug: 'career-skills',
        title: 'Career skills',
        description: 'Skills diagnostics',
        versionNumber: 3,
        versionStatus: 'DRAFT',
        questionCount: 2,
        questions: [
          {
            id: 11,
            type: 'OPEN_TEXT',
            title: 'Что вам легче всего дается?',
            description: null,
          },
          {
            id: 12,
            type: 'SINGLE_CHOICE',
            title: 'Как вы реагируете на изменения?',
            description: 'Выберите один вариант.',
          },
        ],
      },
      {
        id: 32,
        topicId: 13,
        topicSlug: 'soft-skills',
        title: 'Soft skills',
        description: null,
        versionNumber: 1,
        versionStatus: 'PUBLISHED',
        questionCount: 1,
        questions: [
          {
            id: 21,
            type: 'SLIDER',
            title: 'Насколько комфортна коммуникация?',
            description: null,
          },
        ],
      },
    ]);
  });
});
