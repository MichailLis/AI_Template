import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import type {
  CreateTestsTopicFromAiDto,
  CreateTestsTopicDto,
  DeleteTestsTopicResponseDto,
  ReorderTestsQuestionsDto,
  PublishTestsTopicResponseDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from './dto/tests.dto';
import {
  buildAiQuestionPayloads,
  cloneQuestionsToVersion,
  createQuestionsInVersion,
  createTopicWithDraft,
} from './tests-topic-version.utils';
import { mapQuestion, validateDraftForPublish } from './tests-domain.utils';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { ensureUniqueTopicSlug } from './tests-topic-slug.utils';
import { TestsQuestionService } from './tests-question.service';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly testsQuestionService: TestsQuestionService,
  ) {}

  private async getTopicSnapshot(topicId: number) {
    const topic = await this.prisma.testTopic.findUnique({
      where: { id: topicId },
      include: {
        activeDraftVersion: {
          include: {
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

  async listTopics(userId: number): Promise<TestsTopicListResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

    const topics = await this.prisma.testTopic.findMany({
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

  async createTopic(
    userId: number,
    dto: CreateTestsTopicDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

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
    await ensureTestsAdminAccess(this.prisma, userId);

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

  async deleteTopic(userId: number, topicId: number): Promise<DeleteTestsTopicResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

    const topic = await this.prisma.testTopic.findUnique({
      where: { id: topicId },
      select: { id: true },
    });

    if (!topic) {
      throw new NotFoundException('Test topic not found');
    }

    await this.prisma.testTopic.delete({
      where: { id: topicId },
    });

    return {
      topicId,
    };
  }

  async getTopicDraft(userId: number, topicId: number): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

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
        questions: draft.questions.map((question) => mapQuestion(question)),
      },
      published: topic.activePublishedVersion
        ? {
            id: topic.activePublishedVersion.id,
            versionNumber: topic.activePublishedVersion.versionNumber,
            title: topic.activePublishedVersion.title,
          }
        : null,
    };
  }

  async updateTopicDraft(
    userId: number,
    topicId: number,
    dto: UpdateTestsTopicDraftDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);

    await this.prisma.testTopicVersion.update({
      where: { id: topic.activeDraftVersion.id },
      data: {
        title: dto.title ?? topic.activeDraftVersion.title,
        description:
          dto.description !== undefined ? dto.description : topic.activeDraftVersion.description,
      },
    });

    return this.getTopicDraft(userId, topicId);
  }

  async createQuestion(
    userId: number,
    topicId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

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
    await ensureTestsAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.updateQuestion(topic.activeDraftVersion, questionId, dto);

    return this.getTopicDraft(userId, topicId);
  }

  async deleteQuestion(
    userId: number,
    topicId: number,
    questionId: number,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.deleteQuestion(topic.activeDraftVersion, questionId);

    return this.getTopicDraft(userId, topicId);
  }

  async reorderQuestions(
    userId: number,
    topicId: number,
    dto: ReorderTestsQuestionsDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.reorderQuestions(topic.activeDraftVersion, dto);

    return this.getTopicDraft(userId, topicId);
  }

  async publishTopic(userId: number, topicId: number): Promise<PublishTestsTopicResponseDto> {
    await ensureTestsAdminAccess(this.prisma, userId);

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
