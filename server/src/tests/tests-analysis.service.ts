import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type TestStudentAnalysis, type TestStudentAttempt } from '@prisma/client';

import {
  fetchOpenRouterModels,
  generateOpenRouterPrompt,
  resolveOpenRouterTimeoutMs,
} from '../admin/openrouter.client';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { PrismaService } from '../prisma.service';
import { TestAnalysisResultJsonSchema, TestAnalysisResultSchema } from './dto/tests-analysis.dto';
import {
  ProfOrientationV3PlusEnrichmentJsonSchema,
  parseProfOrientationV3PlusEnrichment,
} from './prof-orientation-v3-plus.enrichment';
import {
  isProfOrientationV3PlusSummary,
  resolveProfOrientationV3PlusConfig,
  scoreProfOrientationV3Plus,
} from './prof-orientation-v3-plus.scoring';
import type { AttemptWithSessionData } from './tests-attempt.query';

interface StubAnalysisInput {
  attemptId: number;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
}

interface PendingLlmAnalysisInput {
  attemptId: number;
  promptVersionId: number;
}

interface ProfOrientationAnalysisInput {
  attempt: AttemptWithSessionData;
  promptVersionId: number | null;
}

interface AnalysisPromptVersionRecord {
  id: number;
  model: string;
  temperature: number;
  prompt: string;
}

interface ProfOrientationAttemptAnalysisRecord {
  id: number;
  analysis: {
    summary: unknown;
  } | null;
  topicVersion: {
    questions: Array<{
      id: number;
      type: string;
      title: string;
      description: string | null;
      required: boolean;
      order: number;
      settings: unknown;
      options: Array<{
        id: number;
        label: string;
        value: string;
        order: number;
      }>;
      sliderBands: Array<{
        id: number;
        minValue: number;
        maxValue: number;
        label: string;
        order: number;
      }>;
    }>;
  };
  answers: Array<{
    questionId: number;
    questionTitleSnapshot: string;
    questionTypeSnapshot: string;
    answerPayload: unknown;
  }>;
}

const PROF_ORIENTATION_OPENROUTER_TIMEOUT_MS = 180_000;
const PROF_ORIENTATION_TIMEOUT_RETRIES = 1;
const PROF_ORIENTATION_MAX_TIMEOUT_RETRIES = 2;
const STALE_PENDING_ANALYSIS_MINUTES = 10;
const STALE_PENDING_ANALYSIS_RECOVERY_LIMIT = 20;

@Injectable()
export class TestsAnalysisService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
  ) {}

  private buildAttemptAnalysisPrompt(input: {
    prompt: string;
    questions: unknown[];
    answers: unknown[];
  }) {
    return [
      input.prompt.trim(),
      '',
      'Данные завершенного тестирования студента:',
      JSON.stringify(
        {
          questions: input.questions,
          answers: input.answers,
        },
        null,
        2,
      ),
      '',
      'Сформируй анализ в JSON по заданной схеме.',
      'Обязательно заполни introduction: короткое введение к результату на 2-4 предложения без маркированного списка.',
      'Остальные блоки: текущий уровень базовых навыков, тип мышления, личностные особенности, рекомендации по карьерному и профессиональному развитию.',
    ].join('\n');
  }

  private buildProfOrientationEnrichmentPrompt(input: {
    prompt: string;
    algorithmSummary: unknown;
    questions: unknown[];
    answers: unknown[];
  }) {
    return [
      input.prompt.trim(),
      '',
      'Алгоритмический результат профориентационного теста:',
      JSON.stringify(input.algorithmSummary, null, 2),
      '',
      'Исходные вопросы и ответы участника:',
      JSON.stringify(
        {
          questions: input.questions,
          answers: input.answers,
        },
        null,
        2,
      ),
      '',
      'Сформируй только дополнительное текстовое пояснение в JSON по методической схеме профориентации v3+.',
      'Не меняй рассчитанные алгоритмом направление, уверенность, баллы, профиль и профессии.',
      'professorSummary — 2-3 предложения для блока "Профессор Полюс говорит": простым языком объясни карточку результата, ближайший смысл для школьника и одну понятную практическую пробу; это должна быть законченная фраза 240-420 символов, не заголовок и не знак препинания. Не копируй дословно resultCard.meaning или profile.meaning, переформулируй их как живое ИИ-пояснение.',
      'summary — человекочитаемое пояснение карточки результата для блока "Как читать результат": без нового вывода, без пересчета профиля и без внутренних деталей методики.',
      'Пиши для школьника и педагога простым языком: не используй технические ключи JSON и внутренние коды вроде single_profile, mixed_profile, broad_interest, low_definition, primaryDirection, topDirections, A1, gap, consistencyIndex, readinessTop, selectedCounts или sliderValues.',
      'не раскрывай внутреннюю механику подсчета: не называй веса, формулы, балльные отрывы, значения слайдеров, номера вопросов и служебные признаки.',
      'Опирайся на profile.type, profile, topDirections, primaryDirection.resultCard, confidence, flags, selectedCounts и sliderValues.',
      'Ветвление по profile.type обязательно: single_profile объясняй через primaryDirection.resultCard; mixed_profile — через profile.title, две topDirections и общий miniProject; broad_interest/low_definition — без жесткой рекомендации, как практические пробы нескольких направлений.',
      'methodSignals нужны как внутренние опорные наблюдения; пиши их без кодов, чисел шкал, формул и служебных терминов.',
      'firstSteps должны быть основаны на resultCard.tryActions, profile.miniProject или практических пробах из методики.',
      'learningPlan должен быть основан на resultCard.learn и близких topDirections.',
      'professionNotes комментируют только профессии из рассчитанных направлений; для broad_interest/low_definition можно вернуть пустой массив.',
      'cautions заполняй только при низкой/широкой уверенности или flags; если сильных предупреждений нет, верни пустой массив.',
      'Не создавай общий psychological/personality анализ и не используй старые блоки skillsLevel, thinkingType, personalityTraits, careerDevelopment.',
    ].join('\n');
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Analysis generation failed';
  }

  private isOpenRouterTimeoutError(error: unknown) {
    return this.toErrorMessage(error) === 'OpenRouter request timeout';
  }

  private getProfOrientationOpenRouterTimeoutMs() {
    const rawValue = this.config.get<string | number>('OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS');
    const parsedValue =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string'
          ? Number(rawValue)
          : NaN;

    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }

    return Math.max(
      resolveOpenRouterTimeoutMs(this.config),
      PROF_ORIENTATION_OPENROUTER_TIMEOUT_MS,
    );
  }

  private getProfOrientationTimeoutRetries() {
    const rawValue = this.config.get<string | number>(
      'OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES',
    );
    const parsedValue =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string'
          ? Number(rawValue)
          : NaN;

    if (!Number.isFinite(parsedValue)) {
      return PROF_ORIENTATION_TIMEOUT_RETRIES;
    }

    return Math.min(PROF_ORIENTATION_MAX_TIMEOUT_RETRIES, Math.max(0, Math.floor(parsedValue)));
  }

  private async generateProfOrientationPromptWithTimeoutRetry(
    apiKey: string,
    dto: Parameters<typeof generateOpenRouterPrompt>[2],
  ) {
    const retries = this.getProfOrientationTimeoutRetries();
    const timeoutMs = this.getProfOrientationOpenRouterTimeoutMs();
    let attempt = 0;

    while (true) {
      try {
        return await generateOpenRouterPrompt(this.config, apiKey, dto, { timeoutMs });
      } catch (error) {
        if (!this.isOpenRouterTimeoutError(error) || attempt >= retries) {
          throw error;
        }

        attempt += 1;
      }
    }
  }

  private async resolveStructuredModel(apiKey: string, savedModel: string) {
    try {
      const catalog = await fetchOpenRouterModels(this.config, apiKey);

      if (catalog.models.some((model) => model.id === savedModel)) {
        return savedModel;
      }

      return catalog.defaultModel || savedModel;
    } catch {
      return savedModel;
    }
  }

  upsertStubAnalysis(
    tx: Prisma.TransactionClient,
    input: StubAnalysisInput,
  ): Promise<TestStudentAnalysis> {
    const now = new Date();
    const completionRate =
      input.totalQuestionsCount > 0
        ? Math.round((input.answeredQuestionsCount / input.totalQuestionsCount) * 100)
        : 0;

    const summary = {
      mode: 'stub',
      answeredQuestionsCount: input.answeredQuestionsCount,
      totalQuestionsCount: input.totalQuestionsCount,
      completionRate,
      note: 'LLM analysis is not enabled yet. This is a deterministic placeholder.',
    };

    return tx.testStudentAnalysis.upsert({
      where: {
        attemptId: input.attemptId,
      },
      create: {
        attemptId: input.attemptId,
        providerMode: 'STUB',
        status: 'READY',
        summary,
        rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        generatedAt: now,
      },
      update: {
        providerMode: 'STUB',
        status: 'READY',
        summary,
        rawText: 'Stub analysis is ready. LLM integration will be added in the next iteration.',
        errorMessage: null,
        generatedAt: now,
      },
    });
  }

  upsertPendingLlmAnalysis(
    tx: Prisma.TransactionClient,
    input: PendingLlmAnalysisInput,
  ): Promise<TestStudentAnalysis> {
    return tx.testStudentAnalysis.upsert({
      where: {
        attemptId: input.attemptId,
      },
      create: {
        attemptId: input.attemptId,
        promptVersionId: input.promptVersionId,
        providerMode: 'LLM',
        status: 'PENDING',
        summary: Prisma.JsonNull,
        rawText: null,
        errorMessage: null,
        generatedAt: null,
      },
      update: {
        promptVersionId: input.promptVersionId,
        providerMode: 'LLM',
        status: 'PENDING',
        summary: Prisma.JsonNull,
        rawText: null,
        errorMessage: null,
        generatedAt: null,
      },
    });
  }

  upsertProfOrientationV3PlusAnalysis(
    tx: Prisma.TransactionClient,
    input: ProfOrientationAnalysisInput,
  ): Promise<TestStudentAnalysis> {
    const now = new Date();
    const summary = scoreProfOrientationV3Plus({
      questions: input.attempt.topicVersion.questions,
      answers: input.attempt.answers,
      config: resolveProfOrientationV3PlusConfig(input.attempt.topicVersion.scoringConfig),
      llmStatus: input.promptVersionId ? 'pending' : 'not_requested',
    });
    const providerMode = input.promptVersionId ? 'ALGORITHM_LLM' : 'ALGORITHM';
    const rawText = JSON.stringify(summary);

    return tx.testStudentAnalysis.upsert({
      where: {
        attemptId: input.attempt.id,
      },
      create: {
        attemptId: input.attempt.id,
        promptVersionId: input.promptVersionId,
        providerMode,
        status: 'READY',
        summary: summary as unknown as Prisma.InputJsonValue,
        rawText,
        errorMessage: null,
        generatedAt: now,
      },
      update: {
        promptVersionId: input.promptVersionId,
        providerMode,
        status: 'READY',
        summary: summary as unknown as Prisma.InputJsonValue,
        rawText,
        errorMessage: null,
        generatedAt: now,
      },
    });
  }

  enqueueAttemptAnalysis(attemptId: number) {
    void this.runAttemptAnalysis(attemptId).catch(() => undefined);
  }

  onApplicationBootstrap() {
    void this.recoverStalePendingLlmAnalyses().catch(() => undefined);
  }

  async recoverStalePendingLlmAnalyses(now = new Date()) {
    const staleBefore = new Date(now.getTime() - STALE_PENDING_ANALYSIS_MINUTES * 60 * 1000);
    const analyses = await this.prisma.testStudentAnalysis.findMany({
      where: {
        status: 'PENDING',
        providerMode: 'LLM',
        updatedAt: {
          lt: staleBefore,
        },
        attempt: {
          status: 'COMPLETED',
          topicVersion: {
            analysisPromptVersionId: {
              not: null,
            },
          },
        },
      },
      select: {
        attemptId: true,
      },
      orderBy: {
        updatedAt: 'asc',
      },
      take: STALE_PENDING_ANALYSIS_RECOVERY_LIMIT,
    });

    for (const analysis of analyses) {
      this.enqueueAttemptAnalysis(analysis.attemptId);
    }

    return analyses.length;
  }

  async runAttemptAnalysis(attemptId: number) {
    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: { id: attemptId },
      include: {
        analysis: true,
        topicVersion: {
          include: {
            analysisPromptVersion: true,
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: { orderBy: { order: 'asc' } },
                sliderBands: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
        answers: {
          orderBy: { updatedAt: 'asc' },
        },
      },
    });

    const promptVersion = attempt?.topicVersion.analysisPromptVersion;

    if (!attempt || !promptVersion) {
      return;
    }

    if (attempt.topicVersion.scoringKind === 'PROF_ORIENTATION_V3_PLUS') {
      await this.runProfOrientationEnrichment(attempt, promptVersion);
      return;
    }

    try {
      const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();
      const model = await this.resolveStructuredModel(apiKey, promptVersion.model);
      const questions = attempt.topicVersion.questions.map((question) => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        order: question.order,
        settings: question.settings,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          order: option.order,
        })),
        sliderBands: question.sliderBands.map((band) => ({
          id: band.id,
          minValue: band.minValue,
          maxValue: band.maxValue,
          label: band.label,
          order: band.order,
        })),
      }));
      const answers = attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        questionTitle: answer.questionTitleSnapshot,
        questionType: answer.questionTypeSnapshot,
        answerPayload: answer.answerPayload,
      }));
      const response = await generateOpenRouterPrompt(this.config, apiKey, {
        model,
        prompt: this.buildAttemptAnalysisPrompt({
          prompt: promptVersion.prompt,
          questions,
          answers,
        }),
        temperature: promptVersion.temperature,
        responseFormat: 'json',
        responseSchema: TestAnalysisResultJsonSchema,
        requireParameters: true,
        useResponseHealing: true,
      });
      const parsedOutput = TestAnalysisResultSchema.parse(JSON.parse(response.output));

      await this.prisma.testStudentAnalysis.update({
        where: { attemptId },
        data: {
          promptVersionId: promptVersion.id,
          providerMode: 'LLM',
          status: 'READY',
          summary: parsedOutput,
          rawText: response.output,
          errorMessage: null,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.testStudentAnalysis.update({
        where: { attemptId },
        data: {
          promptVersionId: promptVersion.id,
          providerMode: 'LLM',
          status: 'FAILED',
          errorMessage: this.toErrorMessage(error),
          generatedAt: new Date(),
        },
      });
    }
  }

  private async runProfOrientationEnrichment(
    attempt: ProfOrientationAttemptAnalysisRecord,
    promptVersion: AnalysisPromptVersionRecord,
  ) {
    const currentSummary = attempt.analysis?.summary;

    if (!isProfOrientationV3PlusSummary(currentSummary)) {
      return;
    }

    try {
      const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();
      const model = await this.resolveStructuredModel(apiKey, promptVersion.model);
      const questions = attempt.topicVersion.questions.map((question) => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        order: question.order,
        settings: question.settings,
        options: question.options.map((option) => ({
          id: option.id,
          label: option.label,
          value: option.value,
          order: option.order,
        })),
        sliderBands: question.sliderBands.map((band) => ({
          id: band.id,
          minValue: band.minValue,
          maxValue: band.maxValue,
          label: band.label,
          order: band.order,
        })),
      }));
      const answers = attempt.answers.map((answer) => ({
        questionId: answer.questionId,
        questionTitle: answer.questionTitleSnapshot,
        questionType: answer.questionTypeSnapshot,
        answerPayload: answer.answerPayload,
      }));
      const response = await this.generateProfOrientationPromptWithTimeoutRetry(apiKey, {
        model,
        prompt: this.buildProfOrientationEnrichmentPrompt({
          prompt: promptVersion.prompt,
          algorithmSummary: currentSummary,
          questions,
          answers,
        }),
        temperature: promptVersion.temperature,
        responseFormat: 'json',
        responseSchema: ProfOrientationV3PlusEnrichmentJsonSchema,
        requireParameters: true,
        useResponseHealing: true,
      });
      const parsedOutput = parseProfOrientationV3PlusEnrichment(JSON.parse(response.output));
      const summary = {
        ...currentSummary,
        llm: {
          status: 'ready' as const,
          analysis: parsedOutput,
        },
      };

      await this.prisma.testStudentAnalysis.update({
        where: { attemptId: attempt.id },
        data: {
          promptVersionId: promptVersion.id,
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          summary: summary as unknown as Prisma.InputJsonValue,
          rawText: response.output,
          errorMessage: null,
          generatedAt: new Date(),
        },
      });
    } catch (error) {
      const errorMessage = this.toErrorMessage(error);
      const summary = {
        ...currentSummary,
        llm: {
          status: 'failed' as const,
          errorMessage,
        },
      };

      await this.prisma.testStudentAnalysis.update({
        where: { attemptId: attempt.id },
        data: {
          promptVersionId: promptVersion.id,
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          summary: summary as unknown as Prisma.InputJsonValue,
          errorMessage,
          generatedAt: new Date(),
        },
      });
    }
  }

  toPublicAnalysisResponse(analysis: TestStudentAnalysis | null) {
    if (!analysis) {
      return {
        providerMode: 'STUB' as const,
        status: 'PENDING' as const,
        summary: null,
        errorMessage: null,
        generatedAt: null,
      };
    }

    return {
      providerMode: analysis.providerMode,
      status: analysis.status,
      summary: analysis.summary,
      errorMessage: analysis.errorMessage,
      generatedAt: analysis.generatedAt ? analysis.generatedAt.toISOString() : null,
    };
  }

  toAttemptStatus(attempt: Pick<TestStudentAttempt, 'status' | 'finishedAt' | 'expiresAt'>) {
    if (attempt.status === 'COMPLETED') {
      return 'COMPLETED' as const;
    }

    if (attempt.status === 'EXPIRED') {
      return 'EXPIRED' as const;
    }

    if (attempt.status === 'ABANDONED') {
      return 'ABANDONED' as const;
    }

    if (attempt.finishedAt) {
      return 'COMPLETED' as const;
    }

    if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt && new Date() > attempt.expiresAt) {
      return 'EXPIRED' as const;
    }

    return 'IN_PROGRESS' as const;
  }
}
