import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, type TestStudentAnalysis, type TestStudentAttempt } from '@prisma/client';

import { fetchOpenRouterModels, generateOpenRouterPrompt } from '../admin/openrouter.client';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { PrismaService } from '../prisma.service';
import { TestAnalysisResultJsonSchema, TestAnalysisResultSchema } from './dto/tests-analysis.dto';

interface StubAnalysisInput {
  attemptId: number;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
}

interface PendingLlmAnalysisInput {
  attemptId: number;
  promptVersionId: number;
}

@Injectable()
export class TestsAnalysisService {
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
      'Сформируй анализ в JSON: текущий уровень базовых навыков, тип мышления, личностные особенности, рекомендации по карьерному и профессиональному развитию.',
    ].join('\n');
  }

  private toErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : 'Analysis generation failed';
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

  enqueueAttemptAnalysis(attemptId: number) {
    void this.runAttemptAnalysis(attemptId).catch(() => undefined);
  }

  async runAttemptAnalysis(attemptId: number) {
    const attempt = await this.prisma.testStudentAttempt.findUnique({
      where: { id: attemptId },
      include: {
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
          summary: parsedOutput as Prisma.InputJsonValue,
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

  toPublicAnalysisResponse(analysis: TestStudentAnalysis | null) {
    if (!analysis) {
      return {
        providerMode: 'STUB' as const,
        status: 'PENDING' as const,
        summary: null,
        rawText: null,
        errorMessage: null,
        generatedAt: null,
      };
    }

    return {
      providerMode: analysis.providerMode,
      status: analysis.status,
      summary: analysis.summary,
      rawText: analysis.rawText,
      errorMessage: analysis.errorMessage,
      generatedAt: analysis.generatedAt ? analysis.generatedAt.toISOString() : null,
    };
  }

  toAttemptStatus(attempt: Pick<TestStudentAttempt, 'status' | 'finishedAt'>) {
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

    return 'IN_PROGRESS' as const;
  }
}
