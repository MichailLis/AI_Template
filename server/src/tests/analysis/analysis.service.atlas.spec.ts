import type { ConfigService } from '@nestjs/config';

import type { AiProviderClientService } from '../../ai-provider/ai-provider.client';
import type { AiProviderConfigService } from '../../ai-provider/ai-provider-config.service';
import type { PrismaService } from '../../prisma.service';
import { TEST_AI_PROVIDER_CONNECTION } from '../../ai-provider/spec-fixtures';
import { TestsAnalysisService } from '../analysis/analysis.service';
import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION } from '../prof-orientation-v3-plus/atlas.logic';
import { getProfOrientationLlmStatus } from '../prof-orientation-v3-plus/scoring';

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
const llmOutput = JSON.stringify(validProfOrientationEnrichment);

// Алгоритмическая фаза записана, атласа ещё нет, AI ждёт — то, что фоновая задача видит при старте.
const pendingSummary = {
  resultKind: 'prof_orientation_v3_plus',
  profile: { type: 'single_profile' },
  primaryDirection: {
    id: 'A1',
    name: '3D-моделирование',
    professions: [{ code: 'A1-1', title: 'Инженер-конструктор', type: 'core' }],
  },
  secondaryDirection: null,
  topDirections: [],
  llm: { status: 'pending' },
};

const summaryWithFreshAtlas = {
  ...pendingSummary,
  atlas: {
    version: PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION,
    status: 'ready',
    professions: [{ requestedTitle: 'Инженер-конструктор', title: 'Инженер-конструктор' }],
    unmatchedProfessions: [],
    duplicateProfessions: [],
    enterprises: [],
    events: [],
    institutions: [],
  },
};

const attemptWith = (summary: object) => ({
  id: 5,
  analysis: { id: 77, summary },
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

describe('TestsAnalysisService: atlas in the background task', () => {
  let prismaMock: {
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
    testStudentAttempt: { findUnique: jest.Mock };
    testStudentAnalysis: { update: jest.Mock };
  };
  let atlasMock: { saveEnrichedAnalysis: jest.Mock };
  let generatePrompt: jest.Mock;
  let service: TestsAnalysisService;

  const createService = (atlas: unknown) =>
    new TestsAnalysisService(
      prismaMock as unknown as PrismaService,
      { get: jest.fn() } as unknown as ConfigService,
      {
        getConnection: jest.fn().mockResolvedValue(TEST_AI_PROVIDER_CONNECTION),
      } as unknown as AiProviderConfigService,
      {
        // Каталог недоступен: сохранённая модель уходит провайдеру как есть.
        fetchModels: jest.fn().mockRejectedValue(new Error('no catalog')),
        generatePrompt,
      } as unknown as AiProviderClientService,
      atlas as ProfOrientationAtlasService,
    );

  beforeEach(() => {
    prismaMock = {
      $transaction: jest.fn((run: (tx: unknown) => unknown) => run(prismaMock)),
      $queryRaw: jest.fn(),
      testStudentAttempt: { findUnique: jest.fn() },
      testStudentAnalysis: { update: jest.fn().mockResolvedValue({}) },
    };
    atlasMock = { saveEnrichedAnalysis: jest.fn().mockResolvedValue({}) };
    generatePrompt = jest.fn().mockResolvedValue({
      model: 'google/gemini-2.0-flash-exp:free',
      output: llmOutput,
    });
    service = createService(atlasMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('fetches the atlas before the LLM call', async () => {
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue(attemptWith(pendingSummary));
    prismaMock.$queryRaw.mockResolvedValue([{ summary: pendingSummary }]);

    await service.runAttemptAnalysis(5);

    expect(atlasMock.saveEnrichedAnalysis).toHaveBeenCalledTimes(1);
    expect(atlasMock.saveEnrichedAnalysis).toHaveBeenCalledWith(77, pendingSummary);
    expect(atlasMock.saveEnrichedAnalysis.mock.invocationCallOrder[0]).toBeLessThan(
      generatePrompt.mock.invocationCallOrder[0],
    );
  });

  it('does not ask the atlas again when the summary already has a fresh one', async () => {
    // Восстановление после перезапуска берёт задачу заново: готовый атлас второй раз не запрашивается.
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue(attemptWith(summaryWithFreshAtlas));
    prismaMock.$queryRaw.mockResolvedValue([{ summary: summaryWithFreshAtlas }]);

    await service.runAttemptAnalysis(5);

    expect(atlasMock.saveEnrichedAnalysis).not.toHaveBeenCalled();
    expect(generatePrompt).toHaveBeenCalledTimes(1);
  });

  it('still runs the LLM when the atlas step throws', async () => {
    atlasMock.saveEnrichedAnalysis.mockRejectedValue(new Error('settings are unreadable'));
    prismaMock.testStudentAttempt.findUnique.mockResolvedValue(attemptWith(pendingSummary));
    prismaMock.$queryRaw.mockResolvedValue([{ summary: pendingSummary }]);

    await service.runAttemptAnalysis(5);

    const [args] = prismaMock.testStudentAnalysis.update.mock.calls[0] as [
      { data: { summary: unknown } },
    ];
    expect(getProfOrientationLlmStatus(args.data.summary)).toBe('ready');
  });

  describe('atlas and llm writing one analysis row', () => {
    let row: { summary: unknown; rawText: string | null };
    let atlasService: ProfOrientationAtlasService;
    let racingService: TestsAnalysisService;

    beforeEach(() => {
      row = { summary: pendingSummary, rawText: null };
      // Строка под блокировкой: транзакции идут по одной, как при SELECT … FOR UPDATE.
      let lock: Promise<unknown> = Promise.resolve();
      prismaMock.$transaction.mockImplementation((run: (tx: unknown) => Promise<unknown>) => {
        const result = lock.then(() => run(prismaMock));
        lock = result.catch(() => undefined);
        return result;
      });
      prismaMock.$queryRaw.mockImplementation(() =>
        Promise.resolve([{ summary: structuredClone(row.summary) }]),
      );
      prismaMock.testStudentAnalysis.update.mockImplementation(({ data }: { data: object }) => {
        Object.assign(row, data);
        return Promise.resolve(row);
      });
      atlasService = new ProfOrientationAtlasService(
        prismaMock as unknown as PrismaService,
        {
          getProfessionAtlasConnection: jest.fn().mockResolvedValue({
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api-backend',
          }),
        } as never,
        {
          // Атлас отвечает не сразу: за это время LLM успевает дописать свою часть.
          findProfessions: jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 5));
            throw new Error('Atlas is down');
          }),
        } as never,
      );
      racingService = createService(atlasService);
    });

    it('the llm write keeps the atlas stored by the same task after its summary was read', async () => {
      prismaMock.testStudentAttempt.findUnique.mockResolvedValue(attemptWith(pendingSummary));

      await racingService.runAttemptAnalysis(5);

      expect(row.summary).toMatchObject({
        primaryDirection: { id: 'A1' },
        atlas: { status: 'unavailable', errorMessage: 'Atlas is down' },
        llm: { status: 'ready', analysis: validProfOrientationEnrichment },
      });
      expect(row.rawText).toBe(llmOutput);
    });

    it('a slow atlas write over an old copy does not bring llm.status back to pending', async () => {
      // У задачи атлас уже свежий и пропускается, а GET /result тем временем ждёт Атлас
      // с копией, снятой до LLM, и пишет после того, как LLM закончил.
      row.summary = summaryWithFreshAtlas;
      prismaMock.testStudentAttempt.findUnique.mockResolvedValue(
        attemptWith(summaryWithFreshAtlas),
      );

      await Promise.all([
        racingService.runAttemptAnalysis(5),
        atlasService.saveEnrichedAnalysis(77, pendingSummary as never),
      ]);

      expect(row.summary).toMatchObject({
        atlas: { status: 'unavailable' },
        llm: { status: 'ready', analysis: validProfOrientationEnrichment },
      });
      expect(row.rawText).toBe(llmOutput);
    });
  });
});
