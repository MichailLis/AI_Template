import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { TestAnalysisResultJsonSchema } from '../common/analysis/test-analysis-result.contract';
import { PrismaService } from '../prisma.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { runSerializableTransaction } from '../common/prisma-transaction.utils';
import { collectAuditChanges } from '../audit/audit-changes';
import { AuditService } from '../audit/audit.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { OpenRouterClientService } from '../openrouter/openrouter.client';
import { TestsPromptSimulationReadService } from '../tests/analysis/prompt-simulation-read.service';
import type { GeneratePromptDto } from './dto/generate-prompt.dto';

import type {
  AnalysisPromptListResponseDto,
  AnalysisPromptResponseDto,
  AnalysisPromptVersionResponseDto,
  CreateAnalysisPromptDto,
  PromptSimulationRequestDto,
  PromptSimulationResponseDto,
  PromptTestQuestionsResponseDto,
  UpdateAnalysisPromptVersionDto,
} from './dto/analysis-prompt.dto';

const analysisPromptInclude = {
  versions: {
    orderBy: {
      versionNumber: 'desc',
    },
  },
} satisfies Prisma.AnalysisPromptInclude;

type AnalysisPromptRecord = Prisma.AnalysisPromptGetPayload<{
  include: typeof analysisPromptInclude;
}>;

type AnalysisPromptVersionRecord = Prisma.AnalysisPromptVersionGetPayload<Record<string, never>>;

interface PromptActiveTest {
  topicId: number;
  title: string;
  slug: string;
  onPublishedVersion: boolean;
}

const PROMPT_AUDIT_FIELDS = ['title', 'versionNumber', 'model', 'temperature'] as const;

/** Состояние промпта для журнала: название и последняя версия. Текст промпта пишется только фактом. */
const toPromptAuditState = (prompt: AnalysisPromptRecord) => ({
  title: prompt.title,
  versionNumber: prompt.versions[0]?.versionNumber,
  model: prompt.versions[0]?.model,
  temperature: prompt.versions[0]?.temperature,
  prompt: prompt.versions[0]?.prompt,
});

const syntheticAnswersJsonSchema = {
  name: 'student_test_answers',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    required: ['answers'],
    properties: {
      answers: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['questionId', 'answer'],
          properties: {
            questionId: {
              type: 'number',
            },
            answer: {
              type: 'string',
              minLength: 1,
            },
          },
        },
      },
    },
  },
} as const;

const parseJsonOutput = (output: string): unknown => {
  try {
    return JSON.parse(output);
  } catch {
    return output;
  }
};

@Injectable()
export class AnalysisPromptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openRouterApiKeyService: OpenRouterApiKeyService,
    private readonly openRouterClient: OpenRouterClientService,
    private readonly testsPromptSimulationReadService: TestsPromptSimulationReadService,
    private readonly auditService: AuditService,
  ) {}

  private toVersionResponse(version: AnalysisPromptVersionRecord, usedInTestCount = 0) {
    return {
      id: version.id,
      promptId: version.promptId,
      versionNumber: version.versionNumber,
      status: version.status,
      model: version.model,
      temperature: version.temperature,
      prompt: version.prompt,
      usedInTestCount,
      publishedAt: version.publishedAt ? version.publishedAt.toISOString() : null,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString(),
    };
  }

  private toPromptResponse(
    prompt: AnalysisPromptRecord,
    usedInTestCountByVersionId: Map<number, number> = new Map(),
    activeTests: PromptActiveTest[] = [],
  ) {
    return {
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      createdAt: prompt.createdAt.toISOString(),
      updatedAt: prompt.updatedAt.toISOString(),
      versions: prompt.versions.map((version) =>
        this.toVersionResponse(version, usedInTestCountByVersionId.get(version.id) ?? 0),
      ),
      activeTests,
    };
  }

  /**
   * Неархивные тесты, чья опубликованная или рабочая версия, либо историческая версия с активными
   * публичными ссылками или незавершенными попытками подключена к промпту. Фоновый анализ
   * берет промпт из версии теста и на архив промпта не смотрит, поэтому «удаленный» промпт молча
   * продолжал бы анализировать прохождения тестов.
   */
  private async listActiveTestsByPrompt(
    promptIds: number[],
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ): Promise<Map<number, PromptActiveTest[]>> {
    const testsByPromptId = new Map<number, PromptActiveTest[]>();

    if (promptIds.length === 0) {
      return testsByPromptId;
    }

    const usesPrompt = {
      analysisPromptVersion: { promptId: { in: promptIds } },
    } satisfies Prisma.TestTopicVersionWhereInput;
    const versionSelect = {
      select: { title: true, analysisPromptVersion: { select: { promptId: true } } },
    } as const;

    const [topics, pinnedVersions, recoverableAnalyses] = await Promise.all([
      client.testTopic.findMany({
        where: {
          archivedAt: null,
          OR: [{ activePublishedVersion: usesPrompt }, { activeDraftVersion: usesPrompt }],
        },
        select: {
          id: true,
          slug: true,
          activePublishedVersion: versionSelect,
          activeDraftVersion: versionSelect,
        },
        orderBy: { id: 'asc' },
      }),
      client.testTopicVersion.findMany({
        where: {
          analysisPromptVersion: { promptId: { in: promptIds } },
          OR: [
            {
              publicLinks: {
                some: {
                  archivedAt: null,
                  isActive: true,
                },
              },
            },
            {
              studentAttempts: {
                some: {
                  status: 'IN_PROGRESS',
                },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          analysisPromptVersion: { select: { promptId: true } },
          topic: {
            select: {
              id: true,
              slug: true,
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
      client.testStudentAnalysis.findMany({
        where: {
          promptVersion: { promptId: { in: promptIds } },
          attempt: { status: 'COMPLETED' },
          OR: [
            { status: 'PENDING', providerMode: 'LLM' },
            {
              status: 'READY',
              providerMode: 'ALGORITHM_LLM',
              summary: { path: ['llm', 'status'], equals: 'pending' },
            },
          ],
        },
        select: {
          promptVersion: { select: { promptId: true } },
          attempt: {
            select: {
              topicVersion: {
                select: {
                  title: true,
                  topic: { select: { id: true, slug: true } },
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      }),
    ]);

    const addTest = (promptId: number, test: PromptActiveTest) => {
      testsByPromptId.set(promptId, [...(testsByPromptId.get(promptId) ?? []), test]);
    };

    for (const topic of topics) {
      const published = topic.activePublishedVersion;
      const draft = topic.activeDraftVersion;
      const publishedPromptId = published?.analysisPromptVersion?.promptId;
      const draftPromptId = draft?.analysisPromptVersion?.promptId;

      if (published && publishedPromptId !== undefined) {
        addTest(publishedPromptId, {
          topicId: topic.id,
          title: published.title,
          slug: topic.slug,
          onPublishedVersion: true,
        });
      }

      if (draft && draftPromptId !== undefined && draftPromptId !== publishedPromptId) {
        addTest(draftPromptId, {
          topicId: topic.id,
          title: draft.title,
          slug: topic.slug,
          onPublishedVersion: false,
        });
      }
    }

    for (const pinned of pinnedVersions) {
      const promptId = pinned.analysisPromptVersion?.promptId;
      if (promptId === undefined) {
        continue;
      }

      const existing = (testsByPromptId.get(promptId) ?? []).find(
        (test) => test.topicId === pinned.topic.id,
      );

      if (!existing) {
        addTest(promptId, {
          topicId: pinned.topic.id,
          title: pinned.title,
          slug: pinned.topic.slug,
          onPublishedVersion: true,
        });
      } else if (!existing.onPublishedVersion) {
        existing.onPublishedVersion = true;
      }
    }

    for (const analysis of recoverableAnalyses) {
      const promptId = analysis.promptVersion?.promptId;
      if (promptId === undefined) {
        continue;
      }

      const version = analysis.attempt.topicVersion;
      const existing = (testsByPromptId.get(promptId) ?? []).find(
        (test) => test.topicId === version.topic.id,
      );

      if (!existing) {
        addTest(promptId, {
          topicId: version.topic.id,
          title: version.title,
          slug: version.topic.slug,
          onPublishedVersion: true,
        });
      } else if (!existing.onPublishedVersion) {
        existing.onPublishedVersion = true;
      }
    }

    return testsByPromptId;
  }

  /**
   * Считает тесты, а не версии тестов: у одной темы несколько версий может ссылаться на одну и ту
   * же версию промпта, и админу нужно число тестов, которые правка промпта затронет.
   */
  private async countTestsByPromptVersion(versionIds: number[]): Promise<Map<number, number>> {
    const countByVersionId = new Map<number, number>();

    if (versionIds.length === 0) {
      return countByVersionId;
    }

    const testVersions = await this.prisma.testTopicVersion.findMany({
      where: {
        analysisPromptVersionId: { in: versionIds },
      },
      select: {
        analysisPromptVersionId: true,
        topicId: true,
      },
    });

    const topicIdsByVersionId = new Map<number, Set<number>>();

    for (const testVersion of testVersions) {
      const versionId = testVersion.analysisPromptVersionId;

      if (versionId === null) {
        continue;
      }

      const topicIds = topicIdsByVersionId.get(versionId) ?? new Set<number>();
      topicIds.add(testVersion.topicId);
      topicIdsByVersionId.set(versionId, topicIds);
    }

    for (const versionId of versionIds) {
      countByVersionId.set(versionId, topicIdsByVersionId.get(versionId)?.size ?? 0);
    }

    return countByVersionId;
  }

  private async toPromptResponseWithUsage(prompt: AnalysisPromptRecord) {
    const [usedInTestCountByVersionId, activeTestsByPromptId] = await Promise.all([
      this.countTestsByPromptVersion(prompt.versions.map((version) => version.id)),
      this.listActiveTestsByPrompt([prompt.id]),
    ]);

    return this.toPromptResponse(
      prompt,
      usedInTestCountByVersionId,
      activeTestsByPromptId.get(prompt.id),
    );
  }

  private async getEditablePrompt(promptId: number) {
    const prompt = await this.prisma.analysisPrompt.findUnique({
      where: { id: promptId },
      include: analysisPromptInclude,
    });

    if (!prompt || prompt.archivedAt) {
      throw new NotFoundException('Analysis prompt not found');
    }

    if (!prompt.versions[0]) {
      throw new BadRequestException('Analysis prompt has no versions');
    }

    return prompt;
  }

  private buildSyntheticAnswersPrompt(questions: unknown[]) {
    return [
      'Сгенерируй правдоподобные тестовые ответы одного студента на выбранные вопросы.',
      'Ответы нужны только для проверки промпта анализа в админке.',
      'Верни строго JSON по заданной схеме, без пояснений.',
      '',
      JSON.stringify({ questions }, null, 2),
    ].join('\n');
  }

  private buildAnalysisPrompt(prompt: string, questions: unknown[], syntheticAnswers: unknown) {
    return [
      prompt.trim(),
      '',
      'Контекст тестовой симуляции:',
      JSON.stringify(
        {
          questions,
          answers: syntheticAnswers,
        },
        null,
        2,
      ),
      '',
      'Сформируй анализ в JSON по заданной схеме.',
      'Обязательно заполни introduction: короткое введение к результату на 2-4 предложения без маркированного списка.',
    ].join('\n');
  }

  async listPrompts(userId: number): Promise<AnalysisPromptListResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const prompts = await this.prisma.analysisPrompt.findMany({
      where: { archivedAt: null },
      include: analysisPromptInclude,
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    const [usedInTestCountByVersionId, activeTestsByPromptId] = await Promise.all([
      this.countTestsByPromptVersion(
        prompts.flatMap((prompt) => prompt.versions.map((version) => version.id)),
      ),
      this.listActiveTestsByPrompt(prompts.map((prompt) => prompt.id)),
    ]);

    return {
      prompts: prompts.map((prompt) =>
        this.toPromptResponse(
          prompt,
          usedInTestCountByVersionId,
          activeTestsByPromptId.get(prompt.id),
        ),
      ),
    };
  }

  async listTestQuestions(userId: number): Promise<PromptTestQuestionsResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    return {
      tests: await this.testsPromptSimulationReadService.listPromptSimulationTests(),
    };
  }

  async getPromptModels(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();

    return this.openRouterClient.fetchModels(apiKey);
  }

  async generatePrompt(userId: number, dto: GeneratePromptDto) {
    await ensureAdminAccess(this.prisma, userId);

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();

    return this.openRouterClient.generatePrompt(apiKey, dto);
  }

  async createPrompt(
    userId: number,
    dto: CreateAnalysisPromptDto,
  ): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const prompt = await this.prisma.$transaction(async (tx) => {
      const created = await tx.analysisPrompt.create({
        data: {
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          versions: {
            create: {
              versionNumber: 1,
              status: 'DRAFT',
              model: dto.model.trim(),
              temperature: dto.temperature ?? 0.2,
              prompt: dto.prompt.trim(),
              outputSchema: TestAnalysisResultJsonSchema,
            },
          },
        },
        include: analysisPromptInclude,
      });

      await this.auditService.record(
        {
          entityType: 'ANALYSIS_PROMPT',
          entityId: created.id,
          action: 'PROMPT_CREATED',
          actorUserId: userId,
          changes: collectAuditChanges({}, toPromptAuditState(created), {
            fields: PROMPT_AUDIT_FIELDS,
          }),
        },
        tx,
      );

      return created;
    });

    return {
      prompt: this.toPromptResponse(prompt),
    };
  }

  async updatePrompt(
    userId: number,
    promptId: number,
    dto: UpdateAnalysisPromptVersionDto,
  ): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const existingPrompt = await this.getEditablePrompt(promptId);
    const latestVersion = existingPrompt.versions[0];

    const prompt = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.analysisPrompt.update({
        where: { id: promptId },
        data: {
          title: dto.title === undefined ? existingPrompt.title : dto.title.trim(),
          description:
            dto.description === undefined
              ? existingPrompt.description
              : dto.description?.trim() || null,
          versions: {
            create: {
              versionNumber: latestVersion.versionNumber + 1,
              status: 'DRAFT',
              model: dto.model?.trim() ?? latestVersion.model,
              temperature: dto.temperature ?? latestVersion.temperature,
              prompt: dto.prompt?.trim() ?? latestVersion.prompt,
              outputSchema: TestAnalysisResultJsonSchema,
            },
          },
        },
        include: analysisPromptInclude,
      });

      await this.auditService.record(
        {
          entityType: 'ANALYSIS_PROMPT',
          entityId: promptId,
          action: 'PROMPT_VERSION_CREATED',
          actorUserId: userId,
          changes: collectAuditChanges(
            toPromptAuditState(existingPrompt),
            toPromptAuditState(updated),
            {
              fields: PROMPT_AUDIT_FIELDS,
              redactedFields: ['prompt'],
            },
          ),
        },
        tx,
      );

      return updated;
    });

    return {
      prompt: await this.toPromptResponseWithUsage(prompt),
    };
  }

  /** История доступна и у заархивированного промпта: архивация — тоже событие его жизни. */
  async getPromptHistory(userId: number, promptId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const prompt = await this.prisma.analysisPrompt.findUnique({
      where: { id: promptId },
      select: { id: true },
    });

    if (!prompt) {
      throw new NotFoundException('Analysis prompt not found');
    }

    return { events: await this.auditService.listForEntity('ANALYSIS_PROMPT', promptId) };
  }

  async deletePrompt(userId: number, promptId: number): Promise<AnalysisPromptResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    await this.getEditablePrompt(promptId);

    const prompt = await runSerializableTransaction(this.prisma, async (tx) => {
      const currentPrompt = await tx.analysisPrompt.findUnique({
        where: { id: promptId, archivedAt: null },
        select: { id: true },
      });

      if (!currentPrompt) {
        throw new NotFoundException('Analysis prompt not found');
      }

      const publishedTests = (
        (await this.listActiveTestsByPrompt([promptId], tx)).get(promptId) ?? []
      ).filter((test) => test.onPublishedVersion);

      if (publishedTests.length > 0) {
        throw new ConflictException(
          `Analysis prompt is used by published tests: ${publishedTests
            .map((test) => test.slug)
            .join(', ')}`,
        );
      }

      const updated = await tx.analysisPrompt.update({
        where: { id: promptId },
        data: {
          archivedAt: new Date(),
        },
        include: analysisPromptInclude,
      });

      await this.auditService.record(
        {
          entityType: 'ANALYSIS_PROMPT',
          entityId: promptId,
          action: 'PROMPT_ARCHIVED',
          actorUserId: userId,
        },
        tx,
      );

      return updated;
    });

    return {
      prompt: await this.toPromptResponseWithUsage(prompt),
    };
  }

  async publishVersion(
    userId: number,
    versionId: number,
  ): Promise<AnalysisPromptVersionResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const existingVersion = await this.prisma.analysisPromptVersion.findUnique({
      where: { id: versionId },
      select: { id: true, promptId: true },
    });

    if (!existingVersion) {
      throw new NotFoundException('Analysis prompt version not found');
    }

    /**
     * У промпта действует ровно одна опубликованная версия. Без архивации прежней в базе
     * накапливались две PUBLISHED-версии одновременно, и селектор в настройках теста предлагал
     * подключить устаревшую версию с другой моделью.
     */
    const version = await this.prisma.$transaction(async (tx) => {
      await tx.analysisPromptVersion.updateMany({
        where: {
          promptId: existingVersion.promptId,
          status: 'PUBLISHED',
          id: { not: versionId },
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      const updated = await tx.analysisPromptVersion.update({
        where: { id: versionId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      });

      await this.auditService.record(
        {
          entityType: 'ANALYSIS_PROMPT',
          entityId: existingVersion.promptId,
          action: 'PROMPT_VERSION_PUBLISHED',
          actorUserId: userId,
          changes: collectAuditChanges(
            {},
            { publishedVersionNumber: updated.versionNumber },
            { fields: ['publishedVersionNumber'] },
          ),
        },
        tx,
      );

      return updated;
    });

    const usedInTestCountByVersionId = await this.countTestsByPromptVersion([versionId]);

    return {
      version: this.toVersionResponse(version, usedInTestCountByVersionId.get(versionId) ?? 0),
    };
  }

  async simulatePrompt(
    userId: number,
    dto: PromptSimulationRequestDto,
  ): Promise<PromptSimulationResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const apiKey = await this.openRouterApiKeyService.getOpenRouterApiKey();
    const questionPayloads =
      await this.testsPromptSimulationReadService.getPromptSimulationQuestionPayloads(
        dto.questionIds,
      );

    const syntheticAnswers =
      dto.generateAnswers === false
        ? null
        : parseJsonOutput(
            (
              await this.openRouterClient.generatePrompt(apiKey, {
                model: dto.model,
                prompt: this.buildSyntheticAnswersPrompt(questionPayloads),
                temperature: 0.2,
                responseFormat: 'json',
                responseSchema: syntheticAnswersJsonSchema,
                requireParameters: true,
                useResponseHealing: true,
              })
            ).output,
          );

    const analysisResponse = await this.openRouterClient.generatePrompt(apiKey, {
      model: dto.model,
      prompt: this.buildAnalysisPrompt(dto.prompt, questionPayloads, syntheticAnswers),
      temperature: dto.temperature ?? 0.2,
      responseFormat: 'json',
      responseSchema: TestAnalysisResultJsonSchema,
      requireParameters: true,
      useResponseHealing: true,
    });

    return {
      model: analysisResponse.model,
      output: analysisResponse.output,
      syntheticAnswers,
      questionCount: questionPayloads.length,
    };
  }
}
