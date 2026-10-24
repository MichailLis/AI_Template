import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import type {
  CreateTestsTopicFromAiDto,
  CreateTestsTopicDto,
  DeleteTestsTopicResponseDto,
  ReorderTestsQuestionsDto,
  PublishTestsTopicResponseDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicArchiveStatusResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from '../dto/tests.dto';
import { ProfOrientationV3PlusEnrichmentJsonSchema } from '../prof-orientation-v3-plus/enrichment';
import {
  buildProfOrientationV3PlusQuestionPayloads,
  PROF_ORIENTATION_V3_PLUS_CONFIG,
  PROF_ORIENTATION_V3_PLUS_PROMPT,
  PROF_ORIENTATION_V3_PLUS_PROMPT_MODEL,
  PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE,
  PROF_ORIENTATION_V3_PLUS_SLUG,
  PROF_ORIENTATION_V3_PLUS_TITLE,
  toProfOrientationScoringConfig,
} from '../prof-orientation-v3-plus/fixture';
import {
  buildAiQuestionPayloads,
  cloneQuestionsToVersion,
  createQuestionsInVersion,
  createTopicWithDraft,
  lockDraftVersion,
} from '../topics/topic-version.utils';
import { mapQuestion, validateDraftForPublish } from '../shared/domain.utils';
import { ensureUniqueTopicSlug } from '../topics/topic-slug.utils';
import { TestsQuestionService } from '../topics/question.service';
import {
  TOPIC_VERSION_CONTENT_SELECT,
  hasVersionContentChanges,
} from '../topics/topic-version-content';

interface TopicUsage {
  attemptCount: number;
  publicLinkCount: number;
  hasPublishedVersion: boolean;
}

const EMPTY_TOPIC_USAGE: TopicUsage = {
  attemptCount: 0,
  publicLinkCount: 0,
  hasPublishedVersion: false,
};

/** Использование теста для списка и возможность удалить его навсегда — по правилу deleteTopic. */
const toTopicUsageSummary = (usage: TopicUsage = EMPTY_TOPIC_USAGE) => ({
  ...usage,
  canDelete: !usage.hasPublishedVersion && usage.publicLinkCount === 0 && usage.attemptCount === 0,
});

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly testsQuestionService: TestsQuestionService,
  ) {}

  private toAnalysisPromptVersionSummary(
    version: {
      id: number;
      promptId: number;
      versionNumber: number;
      model: string;
      analysisPrompt: {
        title: string;
        archivedAt?: Date | null;
      };
    } | null,
  ) {
    return version
      ? {
          id: version.id,
          promptId: version.promptId,
          promptTitle: version.analysisPrompt.title,
          versionNumber: version.versionNumber,
          model: version.model,
          promptArchived: Boolean(version.analysisPrompt.archivedAt),
        }
      : null;
  }

  private async getTopicSnapshot(topicId: number, client: Prisma.TransactionClient = this.prisma) {
    const topic = await client.testTopic.findUnique({
      where: { id: topicId },
      include: {
        activeDraftVersion: {
          include: {
            analysisPromptVersion: {
              select: {
                id: true,
                promptId: true,
                versionNumber: true,
                model: true,
                analysisPrompt: {
                  select: {
                    title: true,
                    archivedAt: true,
                  },
                },
              },
            },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: { orderBy: { order: 'asc' } },
                sliderBands: { orderBy: { order: 'asc' } },
              },
            },
          },
        },
        activePublishedVersion: {
          select: {
            id: true,
            versionNumber: true,
            title: true,
            analysisPromptVersion: {
              select: {
                id: true,
                promptId: true,
                versionNumber: true,
                model: true,
                analysisPrompt: {
                  select: {
                    title: true,
                    archivedAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException('Test topic not found');
    }

    const draft = topic.activeDraftVersion;

    if (!draft) {
      throw new BadRequestException('Topic has no active draft version');
    }

    return {
      ...topic,
      activeDraftVersion: draft,
    };
  }

  private async ensureProfOrientationPromptVersion(tx: Prisma.TransactionClient) {
    const existingPrompt = await tx.analysisPrompt.findFirst({
      where: {
        title: PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE,
        archivedAt: null,
      },
      include: {
        versions: {
          where: { status: 'PUBLISHED' },
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });
    const existingPublishedVersion = existingPrompt?.versions[0];

    if (existingPublishedVersion) {
      return existingPublishedVersion.id;
    }

    const prompt =
      existingPrompt ??
      (await tx.analysisPrompt.create({
        data: {
          title: PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE,
          description: 'Built-in prompt for Polus prof-orientation v3+ result enrichment',
        },
      }));
    const latestVersion = existingPrompt
      ? await tx.analysisPromptVersion.findFirst({
          where: { promptId: prompt.id },
          orderBy: { versionNumber: 'desc' },
          select: { versionNumber: true },
        })
      : null;
    const createdVersion = await tx.analysisPromptVersion.create({
      data: {
        promptId: prompt.id,
        versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
        status: 'PUBLISHED',
        model: PROF_ORIENTATION_V3_PLUS_PROMPT_MODEL,
        temperature: 0.2,
        prompt: PROF_ORIENTATION_V3_PLUS_PROMPT,
        outputSchema: ProfOrientationV3PlusEnrichmentJsonSchema,
        publishedAt: new Date(),
      },
      select: { id: true },
    });

    return createdVersion.id;
  }

  async listTopics(archived?: boolean): Promise<TestsTopicListResponseDto> {
    const topics = await this.prisma.testTopic.findMany({
      where: archived
        ? {
            archivedAt: {
              not: null,
            },
          }
        : {
            archivedAt: null,
          },
      include: {
        activeDraftVersion: {
          select: {
            id: true,
            versionNumber: true,
            _count: {
              select: {
                questions: true,
              },
            },
            ...TOPIC_VERSION_CONTENT_SELECT,
          },
        },
        activePublishedVersion: {
          select: {
            versionNumber: true,
            ...TOPIC_VERSION_CONTENT_SELECT,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    const topicIds = topics.map((topic) => topic.id);
    const [activePublicLinkCountByTopicId, usageByTopicId] = await Promise.all([
      this.countActivePublicLinksByTopic(topicIds),
      this.collectUsageByTopic(topicIds),
    ]);

    return {
      topics: topics
        .filter((topic) => topic.activeDraftVersion)
        .map((topic) => ({
          id: topic.id,
          slug: topic.slug,
          description: topic.activeDraftVersion!.description,
          draftVersionNumber: topic.activeDraftVersion!.versionNumber,
          draftTitle: topic.activeDraftVersion!.title,
          draftQuestionCount: topic.activeDraftVersion!._count.questions,
          publishedVersionNumber: topic.activePublishedVersion?.versionNumber ?? null,
          publishedTitle: topic.activePublishedVersion?.title ?? null,
          activePublicLinkCount: activePublicLinkCountByTopicId.get(topic.id) ?? 0,
          ...toTopicUsageSummary(usageByTopicId.get(topic.id)),
          scoringKind: topic.activeDraftVersion!.scoringKind,
          hasUnpublishedChanges: topic.activePublishedVersion
            ? hasVersionContentChanges(topic.activeDraftVersion!, topic.activePublishedVersion)
            : false,
          updatedAt: topic.updatedAt.toISOString(),
        })),
    };
  }

  /**
   * Прохождения и ссылки по всем версиям теста и наличие опубликованной версии. Старые версии
   * тоже были выданы ученикам, а deleteTopic запрещает удаление по этим же признакам.
   */
  private async collectUsageByTopic(topicIds: number[]): Promise<Map<number, TopicUsage>> {
    const usageByTopicId = new Map<number, TopicUsage>();

    if (topicIds.length === 0) {
      return usageByTopicId;
    }

    const versions = await this.prisma.testTopicVersion.findMany({
      where: { topicId: { in: topicIds } },
      select: {
        topicId: true,
        status: true,
        _count: { select: { studentAttempts: true, publicLinks: true } },
      },
    });

    for (const version of versions) {
      const usage = usageByTopicId.get(version.topicId) ?? EMPTY_TOPIC_USAGE;

      usageByTopicId.set(version.topicId, {
        attemptCount: usage.attemptCount + version._count.studentAttempts,
        publicLinkCount: usage.publicLinkCount + version._count.publicLinks,
        hasPublishedVersion: usage.hasPublishedVersion || version.status === 'PUBLISHED',
      });
    }

    return usageByTopicId;
  }

  private async countActivePublicLinksByTopic(topicIds: number[]): Promise<Map<number, number>> {
    const countByTopicId = new Map<number, number>();

    if (topicIds.length === 0) {
      return countByTopicId;
    }

    // Count from versions in one SQL statement: loading each link's required version
    // separately can return null when another connection cascades a topic deletion.
    const versions = await this.prisma.testTopicVersion.findMany({
      where: {
        topicId: { in: topicIds },
      },
      select: {
        topicId: true,
        _count: {
          select: {
            publicLinks: {
              where: { archivedAt: null, isActive: true },
            },
          },
        },
      },
    });

    for (const version of versions) {
      countByTopicId.set(
        version.topicId,
        (countByTopicId.get(version.topicId) ?? 0) + version._count.publicLinks,
      );
    }

    return countByTopicId;
  }

  async archiveTopic(topicId: number): Promise<UpdateTestsTopicArchiveStatusResponseDto> {
    const existing = await this.prisma.testTopic.findUnique({
      where: { id: topicId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Test topic not found');
    }

    if (existing.archivedAt) {
      return {
        topicId,
        archivedAt: existing.archivedAt.toISOString(),
      };
    }

    const archived = await this.prisma.testTopic.update({
      where: { id: topicId },
      data: {
        archivedAt: new Date(),
      },
      select: { archivedAt: true },
    });

    return {
      topicId,
      archivedAt: archived.archivedAt ? archived.archivedAt.toISOString() : null,
    };
  }

  async restoreTopic(topicId: number): Promise<UpdateTestsTopicArchiveStatusResponseDto> {
    const existing = await this.prisma.testTopic.findUnique({
      where: { id: topicId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Test topic not found');
    }

    if (!existing.archivedAt) {
      return {
        topicId,
        archivedAt: null,
      };
    }

    await this.prisma.testTopic.update({
      where: { id: topicId },
      data: {
        archivedAt: null,
      },
    });

    return {
      topicId,
      archivedAt: null,
    };
  }

  async createTopic(dto: CreateTestsTopicDto): Promise<TestsTopicDetailResponseDto> {
    const baseSlug = dto.slug ?? dto.title;
    const slug = await ensureUniqueTopicSlug(this.prisma, baseSlug);

    const topicId = await this.prisma.$transaction(async (tx) => {
      const createdTopic = await createTopicWithDraft(tx, {
        slug,
        title: dto.title,
        description: dto.description ?? null,
      });

      return createdTopic.topicId;
    });

    return this.getTopicDraft(topicId);
  }

  async createTopicFromAi(dto: CreateTestsTopicFromAiDto): Promise<TestsTopicDetailResponseDto> {
    const baseSlug = dto.slug ?? dto.title;
    const slug = await ensureUniqueTopicSlug(this.prisma, baseSlug);
    const questionPayloads = buildAiQuestionPayloads(dto.questions);

    const topicId = await this.prisma.$transaction(async (tx) => {
      const createdTopic = await createTopicWithDraft(tx, {
        slug,
        title: dto.title,
        description: dto.description ?? null,
      });

      await createQuestionsInVersion(tx, createdTopic.draftVersionId, questionPayloads);

      return createdTopic.topicId;
    });

    return this.getTopicDraft(topicId);
  }

  async importProfOrientationV3Plus(): Promise<TestsTopicDetailResponseDto> {
    const slug = await ensureUniqueTopicSlug(this.prisma, PROF_ORIENTATION_V3_PLUS_SLUG);
    const questionPayloads = buildProfOrientationV3PlusQuestionPayloads();

    const topicId = await this.prisma.$transaction(async (tx) => {
      const analysisPromptVersionId = await this.ensureProfOrientationPromptVersion(tx);
      const createdTopic = await createTopicWithDraft(tx, {
        slug,
        title: PROF_ORIENTATION_V3_PLUS_TITLE,
        description: PROF_ORIENTATION_V3_PLUS_CONFIG.purpose,
        analysisPromptVersionId,
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        scoringConfig: toProfOrientationScoringConfig(),
      });

      await createQuestionsInVersion(tx, createdTopic.draftVersionId, questionPayloads);

      return createdTopic.topicId;
    });

    return this.getTopicDraft(topicId);
  }

  async deleteTopic(topicId: number): Promise<DeleteTestsTopicResponseDto> {
    const topic = await this.prisma.testTopic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });

    if (!topic) {
      throw new NotFoundException('Test topic not found');
    }

    const protectedVersionsCount = await this.prisma.testTopicVersion.count({
      where: {
        topicId,
        OR: [
          { status: 'PUBLISHED' },
          { publicLinks: { some: {} } },
          { studentAttempts: { some: {} } },
        ],
      },
    });

    if (protectedVersionsCount > 0) {
      throw new BadRequestException(
        'Test topic with published versions, public links, or attempts cannot be hard-deleted',
      );
    }

    await this.prisma.testTopic.delete({
      where: { id: topicId },
    });

    return {
      topicId,
    };
  }

  async getTopicDraft(topicId: number): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);
    const draft = topic.activeDraftVersion;

    return {
      topicId: topic.id,
      slug: topic.slug,
      draft: {
        id: draft.id,
        versionNumber: draft.versionNumber,
        title: draft.title,
        description: draft.description,
        analysisPromptVersion: this.toAnalysisPromptVersionSummary(draft.analysisPromptVersion),
        questions: draft.questions.map((question) => mapQuestion(question)),
      },
      published: topic.activePublishedVersion
        ? {
            id: topic.activePublishedVersion.id,
            versionNumber: topic.activePublishedVersion.versionNumber,
            title: topic.activePublishedVersion.title,
            analysisPromptVersion: this.toAnalysisPromptVersionSummary(
              topic.activePublishedVersion.analysisPromptVersion,
            ),
          }
        : null,
    };
  }

  async updateTopicDraft(
    topicId: number,
    dto: UpdateTestsTopicDraftDto,
  ): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);

    if (dto.analysisPromptVersionId !== undefined && dto.analysisPromptVersionId !== null) {
      const promptVersion = await this.prisma.analysisPromptVersion.findFirst({
        where: {
          id: dto.analysisPromptVersionId,
          status: 'PUBLISHED',
          analysisPrompt: { archivedAt: null },
        },
        select: { id: true },
      });

      if (!promptVersion) {
        throw new BadRequestException('Analysis prompt version must be published');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await lockDraftVersion(tx, topic.activeDraftVersion.id);
      // Prisma skips undefined fields, so only what the request sent is written.
      await tx.testTopicVersion.update({
        where: { id: topic.activeDraftVersion.id },
        data: {
          title: dto.title,
          description: dto.description,
          analysisPromptVersionId: dto.analysisPromptVersionId,
        },
      });
    });

    return this.getTopicDraft(topicId);
  }

  async createQuestion(
    topicId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.createQuestion(topic.activeDraftVersion, dto);

    return this.getTopicDraft(topicId);
  }

  async updateQuestion(
    topicId: number,
    questionId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.updateQuestion(topic.activeDraftVersion, questionId, dto);

    return this.getTopicDraft(topicId);
  }

  async deleteQuestion(topicId: number, questionId: number): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.deleteQuestion(topic.activeDraftVersion, questionId);

    return this.getTopicDraft(topicId);
  }

  async reorderQuestions(
    topicId: number,
    dto: ReorderTestsQuestionsDto,
  ): Promise<TestsTopicDetailResponseDto> {
    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.reorderQuestions(topic.activeDraftVersion, dto);

    return this.getTopicDraft(topicId);
  }

  async publishTopic(topicId: number): Promise<PublishTestsTopicResponseDto> {
    return this.prisma.$transaction(async (tx) => {
      const { activeDraftVersion } = await this.getTopicSnapshot(topicId, tx);
      // A second publish of the same draft gets 409 here instead of a unique-constraint error.
      await lockDraftVersion(tx, activeDraftVersion.id);
      // Re-read under the lock: an edit that committed first is published and cloned with it.
      const topic = await this.getTopicSnapshot(topicId, tx);
      const draft = topic.activeDraftVersion;

      validateDraftForPublish(draft);

      if (topic.activePublishedVersionId && topic.activePublishedVersionId !== draft.id) {
        await tx.testTopicVersion.update({
          where: { id: topic.activePublishedVersionId },
          data: { status: 'ARCHIVED' },
        });
      }

      await tx.testTopicVersion.update({
        where: { id: draft.id },
        data: { status: 'PUBLISHED' },
      });

      const newDraftVersion = await tx.testTopicVersion.create({
        data: {
          topicId: topic.id,
          versionNumber: draft.versionNumber + 1,
          status: 'DRAFT',
          title: draft.title,
          description: draft.description,
          analysisPromptVersionId: draft.analysisPromptVersionId,
          scoringKind: draft.scoringKind,
          scoringConfig:
            draft.scoringConfig === null
              ? Prisma.JsonNull
              : (draft.scoringConfig as Prisma.InputJsonValue),
        },
      });

      await cloneQuestionsToVersion(tx, newDraftVersion.id, draft.questions);

      await tx.testTopic.update({
        where: { id: topic.id },
        data: {
          activePublishedVersionId: draft.id,
          activeDraftVersionId: newDraftVersion.id,
        },
      });

      return {
        topicId: topic.id,
        publishedVersionNumber: draft.versionNumber,
        newDraftVersionNumber: newDraftVersion.versionNumber,
      };
    });
  }
}
