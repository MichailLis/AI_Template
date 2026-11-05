import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Prisma,
  type TestQuestionType,
  type TestStudentAnalysis,
  type TestStudentAttempt,
} from '@prisma/client';

import {
  TestAnalysisResultJsonSchema,
  TestAnalysisResultSchema,
} from '../../common/analysis/test-analysis-result.contract';
import { readFirstEnv, type AiProviderConnection } from '../../ai-provider/ai-provider.config';
import {
  AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE,
  AiProviderClientService,
  type AiModelCatalog,
  type AiPromptRequest,
} from '../../ai-provider/ai-provider.client';
import { AiModelUnavailableError } from '../../ai-provider/ai-provider.failure';
import { AiProviderConfigService } from '../../ai-provider/ai-provider-config.service';
import { PrismaService } from '../../prisma.service';
import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { shouldRefreshProfOrientationAtlasSummary } from '../prof-orientation-v3-plus/atlas.logic';
import {
  ProfOrientationV3PlusEnrichmentJsonSchema,
  parseProfOrientationV3PlusEnrichment,
} from '../prof-orientation-v3-plus/enrichment';
import {
  isProfOrientationV3PlusSummary,
  resolveProfOrientationV3PlusConfig,
  scoreProfOrientationV3Plus,
} from '../prof-orientation-v3-plus/scoring';
import type { AttemptWithSessionData } from '../attempts/attempt.query';
import type { ProfOrientationSummary } from '../prof-orientation-v3-plus/types';
import {
  mapAnswerToPromptPayload,
  mapQuestionToPromptPayload,
} from '../analysis/prompt-payload.utils';
import { mergeAnalysisSummaryKey } from '../analysis/analysis-summary.store';
import { buildAnalysisFailure, describeAnalysisFailure } from './analysis-failure';
import {
  buildAttemptAnalysisPrompt,
  buildProfOrientationEnrichmentPrompt,
} from './analysis-prompt-text';
import { claimFailedAnalysis, findFailedAttemptIds } from './analysis-restart';
import {
  NO_PUBLIC_ANALYSIS_SUMMARY,
  toPublicAnalysisSummary,
} from '../analysis/public-analysis-summary';
import type { PublicSessionAnalysisDto } from '../dto/tests-public.dto';

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
    id: number;
    summary: unknown;
  } | null;
  topicVersion: {
    questions: Array<{
      id: number;
      type: TestQuestionType;
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

const PROF_ORIENTATION_AI_TIMEOUT_MS = 90_000;
const PROF_ORIENTATION_TIMEOUT_RETRIES = 2;
const PROF_ORIENTATION_MAX_TIMEOUT_RETRIES = 2;
// Замеры 2026-10-08: Cloudflare отвечал 60–175 с и стоил в 15 раз дороже, поэтому исключён.
/** Маршрутизация OpenRouter; другим провайдерам клиент её не передаёт. */
const PROF_ORIENTATION_OPENROUTER_PROVIDER = {
  preferred_min_throughput: { p50: 50 },
  ignore: ['cloudflare'],
} as const;
const STALE_PENDING_ANALYSIS_MINUTES = 10;
const STALE_PENDING_ANALYSIS_RECOVERY_LIMIT = 20;
const PENDING_RECOVERY_INTERVAL_MS = 10 * 60 * 1000;
/** Автоповторов за один проход: каждый — платный вызов, а при затяжном сбое созревают разом сотни. */
const AUTO_RETRY_BATCH_LIMIT = 20;
const DEFAULT_LLM_CONCURRENCY = 3;

const PUBLIC_ANALYSIS_ERROR_MESSAGE = 'Analysis failed';

@Injectable()
export class TestsAnalysisService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(TestsAnalysisService.name);
  /** Попытки, чей анализ ждёт слота или идёт: повторная постановка (в т.ч. из восстановления) пропускается. */
  private readonly activeAttemptIds = new Set<number>();
  private readonly slotWaiters: Array<() => void> = [];
  private busySlots = 0;
  private recoveryTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly aiProviderConfig: AiProviderConfigService,
    private readonly aiProviderClient: AiProviderClientService,
    private readonly profOrientationAtlas: ProfOrientationAtlasService,
  ) {}

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Analysis generation failed';
  }

  private isAiProviderTimeoutError(error: unknown) {
    return this.toErrorMessage(error) === AI_PROVIDER_REQUEST_TIMEOUT_MESSAGE;
  }

  private getProfOrientationAiTimeoutMs() {
    const rawValue = readFirstEnv(this.config, [
      'AI_PROF_ORIENTATION_TIMEOUT_MS',
      'OPENROUTER_PROF_ORIENTATION_TIMEOUT_MS',
    ]);
    const parsedValue =
      typeof rawValue === 'number'
        ? rawValue
        : typeof rawValue === 'string'
          ? Number(rawValue)
          : NaN;

    if (Number.isFinite(parsedValue) && parsedValue > 0) {
      return parsedValue;
    }

    return PROF_ORIENTATION_AI_TIMEOUT_MS;
  }

  private getProfOrientationTimeoutRetries() {
    const rawValue = readFirstEnv(this.config, [
      'AI_PROF_ORIENTATION_TIMEOUT_RETRIES',
      'OPENROUTER_PROF_ORIENTATION_TIMEOUT_RETRIES',
    ]);
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
    connection: AiProviderConnection,
    attemptId: number,
    dto: AiPromptRequest,
  ) {
    const retries = this.getProfOrientationTimeoutRetries();
    const timeoutMs = this.getProfOrientationAiTimeoutMs();
    let attempt = 0;

    while (true) {
      const startedAt = Date.now();

      try {
        const response = await this.aiProviderClient.generatePrompt(
          connection,
          { ...dto, sessionId: `prof-orientation-${attemptId}-try-${attempt + 1}` },
          { timeoutMs, usage: { purpose: 'PROF_ORIENTATION_ENRICHMENT', attemptId } },
        );

        this.logger.log(
          `Prof-orientation enrichment attempt ${attemptId} succeeded on try ${attempt + 1} in ${Date.now() - startedAt} ms (model: ${response.model}, provider: ${response.provider ?? 'unknown'}, usage: ${JSON.stringify(response.usage ?? null)})`,
        );

        return response;
      } catch (error) {
        // Повтор пока только на таймаут. Быстрые ошибки провайдера (5xx) тоже можно повторять,
        // но ошибки ключа, лимита денег и 4xx — нельзя; решение владельца: пока не расширять.
        if (!this.isAiProviderTimeoutError(error)) {
          throw error;
        }

        this.logger.warn(
          `Prof-orientation enrichment attempt ${attemptId} timed out on try ${attempt + 1} after ${Date.now() - startedAt} ms`,
        );

        if (attempt >= retries) {
          throw error;
        }

        attempt += 1;
      }
    }
  }

  /** Модель из версии промпта; подмены на другую нет. Недоступной у провайдера модели — понятная ошибка. */
  private async resolveStructuredModel(connection: AiProviderConnection, savedModel: string) {
    let catalog: AiModelCatalog;
    try {
      catalog = await this.aiProviderClient.fetchModels(connection);
    } catch {
      // Каталог недоступен: не блокируем анализ, провайдер сам ответит на неизвестную модель.
      return savedModel;
    }

    if (!catalog.models.some((model) => model.id === savedModel)) {
      throw new AiModelUnavailableError(
        `Модель «${savedModel}» недоступна у провайдера: выберите другую в промпте`,
      );
    }

    return savedModel;
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
    if (this.activeAttemptIds.has(attemptId)) {
      return;
    }

    this.activeAttemptIds.add(attemptId);
    void this.runWithinLimit(attemptId)
      .catch((error: unknown) =>
        this.logger.error(`Analysis of attempt ${attemptId} failed`, error),
      )
      .finally(() => this.activeAttemptIds.delete(attemptId));
  }

  /** Лимит одновременных анализов из `ANALYSIS_LLM_CONCURRENCY`; остальные ждут своей очереди. */
  private async runWithinLimit(attemptId: number) {
    const parsed = Number(this.config.get<string>('ANALYSIS_LLM_CONCURRENCY'));
    const limit = Number.isInteger(parsed) && parsed >= 1 ? parsed : DEFAULT_LLM_CONCURRENCY;

    if (this.busySlots < limit) {
      this.busySlots += 1;
    } else {
      await new Promise<void>((resolve) => this.slotWaiters.push(resolve));
    }

    try {
      await this.runAttemptAnalysis(attemptId);
    } finally {
      // The slot goes straight to the next waiter, so busySlots stays unchanged.
      const next = this.slotWaiters.shift();
      if (next) {
        next();
      } else {
        this.busySlots -= 1;
      }
    }
  }

  onApplicationBootstrap() {
    const recover = () =>
      void Promise.all([
        this.recoverStalePendingLlmAnalyses(),
        this.retryDueFailedAnalyses(),
      ]).catch((error: unknown) => this.logger.error('Recovery of pending analyses failed', error));

    recover();

    if (process.env.SKIP_DB_CONNECT !== 'true') {
      this.recoveryTimer = setInterval(recover, PENDING_RECOVERY_INTERVAL_MS);
      this.recoveryTimer.unref();
    }
  }

  onModuleDestroy() {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      this.recoveryTimer = null;
    }
  }

  async recoverStalePendingLlmAnalyses(now = new Date()) {
    const staleBefore = new Date(now.getTime() - STALE_PENDING_ANALYSIS_MINUTES * 60 * 1000);
    const analyses = await this.prisma.testStudentAnalysis.findMany({
      where: {
        updatedAt: {
          lt: staleBefore,
        },
        attemptId: { notIn: [...this.activeAttemptIds] },
        attempt: {
          status: 'COMPLETED',
          topicVersion: {
            analysisPromptVersionId: {
              not: null,
            },
          },
        },
        OR: [
          {
            status: 'PENDING',
            providerMode: 'LLM',
          },
          {
            status: 'READY',
            providerMode: 'ALGORITHM_LLM',
            summary: {
              path: ['llm', 'status'],
              equals: 'pending',
            },
          },
        ],
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

  /** Упавший анализ → ожидание → очередь. `false`: он не упал (идёт, готов) или перезапуск уже занят. */
  async restartFailedAnalysis(attemptId: number, retryDueAt?: Date) {
    const claimed = await claimFailedAnalysis(this.prisma, attemptId, retryDueAt);

    if (claimed) {
      this.enqueueAttemptAnalysis(attemptId);
    }

    return claimed;
  }

  /** Автоповтор сбоев провайдера, чей срок вышел (`summary.llm.nextRetryAtMs`); партия небольшая. */
  async retryDueFailedAnalyses(now = new Date()) {
    const attemptIds = await findFailedAttemptIds(this.prisma, {
      retryDueAt: now,
      take: AUTO_RETRY_BATCH_LIMIT,
    });
    let restarted = 0;

    for (const attemptId of attemptIds) {
      if (await this.restartFailedAnalysis(attemptId, now)) {
        restarted += 1;
      }
    }

    return restarted;
  }

  /** Состояние неудачи для записи; в лог идёт код причины, а не текст провайдера, ключ или промпт. */
  private recordFailure(
    attemptId: number,
    analysisId: number | undefined,
    error: unknown,
    previousSummary: unknown,
  ) {
    const { state } = buildAnalysisFailure(error, previousSummary);

    this.logger.warn(
      `Analysis ${analysisId ?? 'n/a'} of attempt ${attemptId} failed: ${describeAnalysisFailure(state)}`,
    );

    return state;
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
      const connection = await this.aiProviderConfig.getConnection();
      const model = await this.resolveStructuredModel(connection, promptVersion.model);
      const questions = attempt.topicVersion.questions.map(mapQuestionToPromptPayload);
      const answers = attempt.answers.map(mapAnswerToPromptPayload);
      const response = await this.aiProviderClient.generatePrompt(
        connection,
        {
          model,
          prompt: buildAttemptAnalysisPrompt({
            prompt: promptVersion.prompt,
            questions,
            answers,
          }),
          temperature: promptVersion.temperature,
          responseFormat: 'json',
          responseSchema: TestAnalysisResultJsonSchema,
          requireParameters: true,
          useResponseHealing: true,
        },
        { usage: { purpose: 'STUDENT_ANALYSIS', attemptId } },
      );
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
      const failure = this.recordFailure(
        attemptId,
        attempt.analysis?.id,
        error,
        attempt.analysis?.summary,
      );

      await this.prisma.testStudentAnalysis.update({
        where: { attemptId },
        data: {
          promptVersionId: promptVersion.id,
          providerMode: 'LLM',
          status: 'FAILED',
          summary: { llm: failure },
          errorMessage: this.toErrorMessage(error),
          generatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Атлас идёт до LLM: экран результата опрашивает сервер, пока `llm.status` pending, поэтому к
   * готовому AI-тексту атлас уже записан. Это же место и повторов: после перезапуска сервера
   * задачу берёт восстановление, и свежий атлас второй раз не запрашивается. Сбой атласа не
   * отменяет AI-анализ; `GET /result` повторит атлас после паузы, когда LLM уже не pending.
   */
  private async enrichProfOrientationAtlas(analysisId: number, summary: ProfOrientationSummary) {
    if (!shouldRefreshProfOrientationAtlasSummary(summary)) {
      return;
    }

    try {
      await this.profOrientationAtlas.saveEnrichedAnalysis(analysisId, summary);
    } catch (error) {
      this.logger.warn(
        `Atlas enrichment of analysis ${analysisId} failed: ${this.toErrorMessage(error)}`,
      );
    }
  }

  private async runProfOrientationEnrichment(
    attempt: ProfOrientationAttemptAnalysisRecord,
    promptVersion: AnalysisPromptVersionRecord,
  ) {
    const analysisId = attempt.analysis?.id;
    const currentSummary = attempt.analysis?.summary;

    if (!analysisId || !isProfOrientationV3PlusSummary(currentSummary)) {
      return;
    }

    await this.enrichProfOrientationAtlas(analysisId, currentSummary);

    try {
      const connection = await this.aiProviderConfig.getConnection();
      const model = await this.resolveStructuredModel(connection, promptVersion.model);
      const questions = attempt.topicVersion.questions.map(mapQuestionToPromptPayload);
      const answers = attempt.answers.map(mapAnswerToPromptPayload);
      const response = await this.generateProfOrientationPromptWithTimeoutRetry(
        connection,
        attempt.id,
        {
          model,
          prompt: buildProfOrientationEnrichmentPrompt({
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
          provider: PROF_ORIENTATION_OPENROUTER_PROVIDER,
        },
      );
      const parsedOutput = parseProfOrientationV3PlusEnrichment(JSON.parse(response.output));

      await mergeAnalysisSummaryKey(
        this.prisma,
        analysisId,
        'llm',
        { status: 'ready', model: response.model, analysis: parsedOutput },
        {
          promptVersionId: promptVersion.id,
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          rawText: response.output,
          errorMessage: null,
          generatedAt: new Date(),
        },
      );
    } catch (error) {
      const errorMessage = this.toErrorMessage(error);
      const failure = this.recordFailure(attempt.id, analysisId, error, currentSummary);

      await mergeAnalysisSummaryKey(
        this.prisma,
        analysisId,
        'llm',
        { status: 'failed', model: promptVersion.model, errorMessage, ...failure },
        {
          promptVersionId: promptVersion.id,
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          errorMessage,
          generatedAt: new Date(),
        },
      );
    }
  }

  toPublicAnalysisResponse(analysis: TestStudentAnalysis | null): PublicSessionAnalysisDto {
    if (!analysis) {
      return {
        providerMode: 'STUB',
        status: 'PENDING',
        summary: NO_PUBLIC_ANALYSIS_SUMMARY,
        errorMessage: null,
        generatedAt: null,
      };
    }

    return {
      providerMode: analysis.providerMode,
      status: analysis.status,
      summary: toPublicAnalysisSummary(analysis.summary),
      // Raw provider/parser text can name internal hosts or models; students get a fixed message.
      errorMessage: analysis.errorMessage ? PUBLIC_ANALYSIS_ERROR_MESSAGE : null,
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
