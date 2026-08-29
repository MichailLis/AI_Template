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
} from '../topics/topic-version.utils';
import { mapQuestion, validateDraftForPublish } from '../shared/domain.utils';
import { ensureAdminAccess } from '../../common/authz/admin-access.utils';
import { ensureUniqueTopicSlug } from '../topics/topic-slug.utils';
import { TestsQuestionService } from '../topics/question.service';

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
        }
      : null;
  }

  private async getTopicSnapshot(topicId: number) {
    const topic = await this.prisma.testTopic.findUnique({
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

  async listTopics(userId: number, archived?: boolean): Promise<TestsTopicListResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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
            title: true,
            _count: {
              select: {
                questions: true,
              },
            },
          },
        },
        activePublishedVersion: {
          select: {
            versionNumber: true,
            title: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return {
      topics: topics
        .filter((topic) => topic.activeDraftVersion)
        .map((topic) => ({
          id: topic.id,
          slug: topic.slug,
          draftVersionNumber: topic.activeDraftVersion!.versionNumber,
          draftTitle: topic.activeDraftVersion!.title,
          draftQuestionCount: topic.activeDraftVersion!._count.questions,
          publishedVersionNumber: topic.activePublishedVersion?.versionNumber ?? null,
          publishedTitle: topic.activePublishedVersion?.title ?? null,
          updatedAt: topic.updatedAt.toISOString(),
        })),
    };
  }

  async archiveTopic(
    userId: number,
    topicId: number,
  ): Promise<UpdateTestsTopicArchiveStatusResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

  async restoreTopic(
    userId: number,
    topicId: number,
  ): Promise<UpdateTestsTopicArchiveStatusResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

  async createTopic(
    userId: number,
    dto: CreateTestsTopicDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

    return this.getTopicDraft(userId, topicId);
  }

  async createTopicFromAi(
    userId: number,
    dto: CreateTestsTopicFromAiDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

    return this.getTopicDraft(userId, topicId);
  }

  async importProfOrientationV3Plus(userId: number): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

    return this.getTopicDraft(userId, topicId);
  }

  async deleteTopic(userId: number, topicId: number): Promise<DeleteTestsTopicResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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

  async getTopicDraft(userId: number, topicId: number): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

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
    userId: number,
    topicId: number,
    dto: UpdateTestsTopicDraftDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);

    if (dto.analysisPromptVersionId !== undefined && dto.analysisPromptVersionId !== null) {
      const promptVersion = await this.prisma.analysisPromptVersion.findFirst({
        where: {
          id: dto.analysisPromptVersionId,
          status: 'PUBLISHED',
        },
        select: { id: true },
      });

      if (!promptVersion) {
        throw new BadRequestException('Analysis prompt version must be published');
      }
    }

    const updateData: {
      title: string;
      description: string | null;
      analysisPromptVersionId?: number | null;
    } = {
      title: dto.title ?? topic.activeDraftVersion.title,
      description:
        dto.description !== undefined ? dto.description : topic.activeDraftVersion.description,
    };

    if (dto.analysisPromptVersionId !== undefined) {
      updateData.analysisPromptVersionId = dto.analysisPromptVersionId;
    }

    await this.prisma.testTopicVersion.update({
      where: { id: topic.activeDraftVersion.id },
      data: updateData,
    });

    return this.getTopicDraft(userId, topicId);
  }

  async createQuestion(
    userId: number,
    topicId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.createQuestion(topic.activeDraftVersion, dto);

    return this.getTopicDraft(userId, topicId);
  }

  async updateQuestion(
    userId: number,
    topicId: number,
    questionId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.updateQuestion(topic.activeDraftVersion, questionId, dto);

    return this.getTopicDraft(userId, topicId);
  }

  async deleteQuestion(
    userId: number,
    topicId: number,
    questionId: number,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.deleteQuestion(topic.activeDraftVersion, questionId);

    return this.getTopicDraft(userId, topicId);
  }

  async reorderQuestions(
    userId: number,
    topicId: number,
    dto: ReorderTestsQuestionsDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.reorderQuestions(topic.activeDraftVersion, dto);

    return this.getTopicDraft(userId, topicId);
  }

  async publishTopic(userId: number, topicId: number): Promise<PublishTestsTopicResponseDto> {
    await ensureAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    const draft = topic.activeDraftVersion;

    validateDraftForPublish(draft);

    return this.prisma.$transaction(async (tx) => {
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
