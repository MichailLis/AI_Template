import { ConfigService } from '@nestjs/config';

import { fetchOpenRouterModels, generateOpenRouterPrompt } from '../admin/openrouter.client';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { PrismaService } from '../prisma.service';
import { TestAnalysisResultJsonSchema } from './dto/tests-analysis.dto';
import { ProfOrientationV3PlusEnrichmentJsonSchema } from './prof-orientation-v3-plus.enrichment';
import { TestsAnalysisService } from './tests-analysis.service';

type AnalysisUpsertArgs = {
  create: {
    attemptId: number;
    promptVersionId?: number | null;
    providerMode: string;
    status: string;
  };
  update: {
    promptVersionId?: number | null;
    providerMode: string;
    status: string;
  };
  where: {
    attemptId: number;
  };
};

type AnalysisUpdateArgs = {
  data: {
    promptVersionId?: number | null;
    providerMode: string;
    status: string;
    summary?: unknown;
  };
  where: {
    attemptId: number;
  };
};

jest.mock('../admin/openrouter.client', () => ({
  fetchOpenRouterModels: jest.fn(),
  generateOpenRouterPrompt: jest.fn(),
  resolveOpenRouterTimeoutMs: jest.fn(() => 120_000),
}));

const validAnalysisResult = {
  introduction:
    'По результатам теста виден устойчивый интерес к практическим задачам и постепенному развитию профессиональных навыков.',
  skillsLevel: {
    title: 'Текущий уровень базовых навыков',
    summary: 'Навыки развиты на среднем уровне.',
    items: [
      {
        name: 'Коммуникация',
        level: 'medium',
        score: 68,
        description: 'Умеет объяснять решения.',
      },
    ],
  },
  thinkingType: {
    title: 'Тип мышления',
    type: 'Аналитический',
    description: 'Сначала ищет структуру.',
    strengths: ['структурность'],
  },
  personalityTraits: {
    title: 'Личностные особенности',
    traits: [
      {
        name: 'Самостоятельность',
        description: 'Берет ответственность за задачи.',
        careerImpact: 'Подходит для самостоятельных ролей.',
      },
    ],
  },
  careerDevelopment: {
    summary: 'Стоит развивать портфолио.',
    recommendedDirections: ['аналитика'],
    developmentRecommendations: ['делать мини-проекты'],
    professionalNextSteps: ['получить обратную связь'],
  },
};

const validProfOrientationEnrichment = {
  professorSummary:
    'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели и проверять их на практике.',
  summary:
    'Профиль 3D-моделирования означает, что участнику ближе перевод идеи в точную цифровую модель и подготовку ее к производству.',
  confidenceComment:
    'Высокая уверенность связана с большим отрывом ведущего направления, устойчивыми выборами и достаточной готовностью по цифровым шкалам.',
  methodSignals: [
    'В большинстве вопросов выбран вариант, связанный с 3D-моделированием.',
    'Интерес к направлению A1 выше остальных интересов.',
  ],
  firstSteps: ['Смоделировать простой корпус устройства.', 'Сделать сборку из нескольких деталей.'],
  learningPlan: ['основы черчения', 'CAD/САПР'],
  professionNotes: ['Инженер-конструктор связан с разработкой деталей и сборок.'],
  nextMiniProject: 'Смоделируй корпус небольшого устройства и подготовь чертеж.',
  cautions: [],
};

describe('TestsAnalysisService', () => {
  let service: TestsAnalysisService;
  let prismaMock: {
    testStudentAttempt: {
      findUnique: jest.Mock;
    };
    testStudentAnalysis: {
      update: jest.Mock;
    };
  };
  let txMock: {
    testStudentAnalysis: {
      upsert: jest.Mock;
    };
  };
  let configMock: {
    get: jest.Mock;
  };
  let openRouterApiKeyServiceMock: {
    getOpenRouterApiKey: jest.Mock;
  };

  beforeEach(() => {
    prismaMock = {
      testStudentAttempt: {
        findUnique: jest.fn(),
      },
      testStudentAnalysis: {
        update: jest.fn(),
      },
    };
    txMock = {
      testStudentAnalysis: {
        upsert: jest.fn(),
      },
    };
    configMock = {
      get: jest.fn((key: string) => (key === 'OPENROUTER_API_KEY' ? 'test-key' : undefined)),
    };
    openRouterApiKeyServiceMock = {
      getOpenRouterApiKey: jest.fn().mockResolvedValue('test-key'),
    };

    service = new TestsAnalysisService(
      prismaMock as unknown as PrismaService,
      configMock as unknown as ConfigService,
      openRouterApiKeyServiceMock as unknown as OpenRouterApiKeyService,
    );
    jest.mocked(fetchOpenRouterModels).mockResolvedValue({
      defaultModel: 'google/gemini-2.0-flash-exp:free',
      models: [
        {
          id: 'google/gemini-2.0-flash-exp:free',
          label: 'Gemini',
          provider: 'google',
          isFree: true,
          supportsStructuredOutputs: true,
          contextLength: 1_000_000,
          promptPrice: 0,
          completionPrice: 0,
        },
        {
          id: 'openai/gpt-4.1',
          label: 'GPT-4.1',
          provider: 'openai',
          isFree: false,
          supportsStructuredOutputs: true,
          contextLength: 1_000_000,
          promptPrice: 0.000002,
          completionPrice: 0.000008,
        },
      ],
    });
    jest.mocked(generateOpenRouterPrompt).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('upsertPendingLlmAnalysis creates a pending LLM analysis tied to prompt version', async () => {
    txMock.testStudentAnalysis.upsert.mockResolvedValue({
      id: 1,
      attemptId: 5,
      promptVersionId: 42,
      providerMode: 'LLM',
      status: 'PENDING',
    });

    await service.upsertPendingLlmAnalysis(txMock as never, {
      attemptId: 5,
      promptVersionId: 42,
    });

    const upsertMock = txMock.testStudentAnalysis.upsert as jest.MockedFunction<
      (args: AnalysisUpsertArgs) => Promise<unknown>
    >;
    const upsertArgs = upsertMock.mock.calls[0]?.[0];

    expect(upsertArgs?.where.attemptId).toBe(5);
    expect(upsertArgs?.create).toMatchObject({
      attemptId: 5,
      promptVersionId: 42,
      providerMode: 'LLM',
      status: 'PENDING',
    });
    expect(upsertArgs?.update).toMatchObject({
      promptVersionId: 42,
      providerMode: 'LLM',
      status: 'PENDING',
    });
  });

  it('toAttemptStatus treats expired in-progress attempts as expired without updating storage', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    expect(
      service.toAttemptStatus({
        status: 'IN_PROGRESS',
        finishedAt: null,
        expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      } as never),
    ).toBe('EXPIRED');
    expect(
      service.toAttemptStatus({
        status: 'IN_PROGRESS',
        finishedAt: null,
        expiresAt: new Date('2026-05-12T12:01:00.000Z'),
      } as never),
    ).toBe('IN_PROGRESS');

    jest.useRealTimers();
  });

  it('runAttemptAnalysis stores structured ready analysis from OpenRouter', async () => {
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      topicVersion: {
        analysisPromptVersion: {
          id: 42,
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.2,
          prompt: 'Analyze student answers',
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
      answers: [
        {
          questionId: 100,
          questionTitleSnapshot: 'Что вам легче всего дается?',
          questionTypeSnapshot: 'OPEN_TEXT',
          answerPayload: { text: 'Структурировать задачи' },
        },
      ],
    });
    jest.mocked(generateOpenRouterPrompt).mockResolvedValue({
      model: 'google/gemini-2.0-flash-exp:free',
      output: JSON.stringify(validAnalysisResult),
    });
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    expect(generateOpenRouterPrompt).toHaveBeenCalledWith(
      configMock,
      'test-key',
      expect.objectContaining({
        model: 'google/gemini-2.0-flash-exp:free',
        responseFormat: 'json',
        responseSchema: TestAnalysisResultJsonSchema,
        requireParameters: true,
        useResponseHealing: true,
      }),
    );
    const promptOptions = jest.mocked(generateOpenRouterPrompt).mock.calls[0]?.[2];
    expect(promptOptions?.prompt).toContain('introduction');
    expect(promptOptions?.prompt).toContain('2-4 предложения');
    const updateMock = prismaMock.testStudentAnalysis.update as jest.MockedFunction<
      (args: AnalysisUpdateArgs) => Promise<unknown>
    >;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.where.attemptId).toBe(5);
    expect(updateArgs?.data).toMatchObject({
      promptVersionId: 42,
      providerMode: 'LLM',
      status: 'READY',
      summary: validAnalysisResult,
    });
  });

  it('runAttemptAnalysis stores failed status when OpenRouter output is invalid', async () => {
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      topicVersion: {
        analysisPromptVersion: {
          id: 42,
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.2,
          prompt: 'Analyze student answers',
        },
        questions: [],
      },
      answers: [],
    });
    jest.mocked(generateOpenRouterPrompt).mockResolvedValue({
      model: 'google/gemini-2.0-flash-exp:free',
      output: '{"skillsLevel":null}',
    });
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    const updateMock = prismaMock.testStudentAnalysis.update as jest.MockedFunction<
      (args: AnalysisUpdateArgs) => Promise<unknown>
    >;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.where.attemptId).toBe(5);
    expect(updateArgs?.data).toMatchObject({
      providerMode: 'LLM',
      status: 'FAILED',
    });
  });

  it('runAttemptAnalysis uses default structured model when saved prompt model is unavailable', async () => {
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      topicVersion: {
        analysisPromptVersion: {
          id: 42,
          model: 'baidu/qianfan-ocr-fast:free',
          temperature: 0.2,
          prompt: 'Analyze student answers',
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
      answers: [
        {
          questionId: 100,
          questionTitleSnapshot: 'Что вам легче всего дается?',
          questionTypeSnapshot: 'OPEN_TEXT',
          answerPayload: { text: 'Структурировать задачи' },
        },
      ],
    });
    jest.mocked(generateOpenRouterPrompt).mockResolvedValue({
      model: 'google/gemini-2.0-flash-exp:free',
      output: JSON.stringify(validAnalysisResult),
    });
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    expect(generateOpenRouterPrompt).toHaveBeenCalledWith(
      configMock,
      'test-key',
      expect.objectContaining({
        model: 'google/gemini-2.0-flash-exp:free',
      }),
    );
  });

  it('runAttemptAnalysis enriches prof-orientation summary without changing algorithm fields', async () => {
    const algorithmSummary = {
      resultKind: 'prof_orientation_v3_plus',
      primaryDirection: { id: 'A1', name: '3D-моделирование' },
      confidence: { level: 'high' },
      profile: { type: 'single_profile' },
      llm: { status: 'pending' },
    };
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      analysis: {
        summary: algorithmSummary,
      },
      topicVersion: {
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        analysisPromptVersion: {
          id: 42,
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.2,
          prompt: 'Enrich prof-orientation result',
        },
        questions: [],
      },
      answers: [],
    });
    jest.mocked(generateOpenRouterPrompt).mockResolvedValue({
      model: 'google/gemini-2.0-flash-exp:free',
      output: JSON.stringify(validProfOrientationEnrichment),
    });
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    const updateMock = prismaMock.testStudentAnalysis.update as jest.MockedFunction<
      (args: AnalysisUpdateArgs) => Promise<unknown>
    >;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.data).toMatchObject({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: {
        resultKind: 'prof_orientation_v3_plus',
        primaryDirection: { id: 'A1', name: '3D-моделирование' },
        confidence: { level: 'high' },
        profile: { type: 'single_profile' },
        llm: {
          status: 'ready',
          analysis: validProfOrientationEnrichment,
        },
      },
    });
    expect(generateOpenRouterPrompt).toHaveBeenCalledWith(
      configMock,
      'test-key',
      expect.objectContaining({
        responseSchema: ProfOrientationV3PlusEnrichmentJsonSchema,
      }),
      { timeoutMs: 180_000 },
    );
    const promptOptions = jest.mocked(generateOpenRouterPrompt).mock.calls[0]?.[2];
    expect(promptOptions?.prompt).toContain('Профессор Полюс говорит');
    expect(promptOptions?.prompt).toContain('240-420 символов');
    expect(promptOptions?.prompt).toContain('не раскрывай внутреннюю механику подсчета');
    expect(promptOptions?.prompt).toContain('profile.type');
    expect(promptOptions?.prompt).toContain('не используй технические ключи');
  });

  it('runAttemptAnalysis retries prof-orientation enrichment once after OpenRouter timeout', async () => {
    const algorithmSummary = {
      resultKind: 'prof_orientation_v3_plus',
      primaryDirection: { id: 'A1', name: '3D-моделирование' },
      confidence: { level: 'high' },
      profile: { type: 'single_profile' },
      llm: { status: 'pending' },
    };
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      analysis: {
        summary: algorithmSummary,
      },
      topicVersion: {
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        analysisPromptVersion: {
          id: 42,
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.2,
          prompt: 'Enrich prof-orientation result',
        },
        questions: [],
      },
      answers: [],
    });
    jest
      .mocked(generateOpenRouterPrompt)
      .mockRejectedValueOnce(new Error('OpenRouter request timeout'))
      .mockResolvedValue({
        model: 'google/gemini-2.0-flash-exp:free',
        output: JSON.stringify(validProfOrientationEnrichment),
      });
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    expect(generateOpenRouterPrompt).toHaveBeenCalledTimes(2);
    const firstPromptCall = jest.mocked(generateOpenRouterPrompt).mock.calls[0] as unknown[];
    expect(firstPromptCall[3]).toMatchObject({
      timeoutMs: 180_000,
    });
    const updateMock = prismaMock.testStudentAnalysis.update as jest.MockedFunction<
      (args: AnalysisUpdateArgs) => Promise<unknown>
    >;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.data).toMatchObject({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: {
        resultKind: 'prof_orientation_v3_plus',
        llm: {
          status: 'ready',
          analysis: validProfOrientationEnrichment,
        },
      },
    });
  });

  it('runAttemptAnalysis does not retry prof-orientation enrichment after non-timeout errors', async () => {
    const algorithmSummary = {
      resultKind: 'prof_orientation_v3_plus',
      primaryDirection: { id: 'A1', name: '3D-моделирование' },
      confidence: { level: 'high' },
      profile: { type: 'single_profile' },
      llm: { status: 'pending' },
    };
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue({
      id: 5,
      analysis: {
        summary: algorithmSummary,
      },
      topicVersion: {
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        analysisPromptVersion: {
          id: 42,
          model: 'google/gemini-2.0-flash-exp:free',
          temperature: 0.2,
          prompt: 'Enrich prof-orientation result',
        },
        questions: [],
      },
      answers: [],
    });
    jest
      .mocked(generateOpenRouterPrompt)
      .mockRejectedValue(new Error('OpenRouter returned an empty response'));
    prismaMock.testStudentAnalysis.update.mockResolvedValue({});

    await service.runAttemptAnalysis(5);

    expect(generateOpenRouterPrompt).toHaveBeenCalledTimes(1);
    const updateMock = prismaMock.testStudentAnalysis.update as jest.MockedFunction<
      (args: AnalysisUpdateArgs) => Promise<unknown>
    >;
    const updateArgs = updateMock.mock.calls[0]?.[0];

    expect(updateArgs?.data).toMatchObject({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: {
        resultKind: 'prof_orientation_v3_plus',
        llm: {
          status: 'failed',
          errorMessage: 'OpenRouter returned an empty response',
        },
      },
    });
  });
});
