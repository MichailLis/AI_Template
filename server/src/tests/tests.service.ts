import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
  mapQuestion,
  normalizeSlug,
  parseSliderSettings,
  prepareQuestionPayload,
  toPrismaSettingsInput,
  validateDraftForPublish,
} from './tests-domain.utils';
import { TestsQuestionService } from './tests-question.service';

@Injectable()
export class TestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly testsQuestionService: TestsQuestionService,
  ) {}

  private async ensureAdminAccess(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }
  }

  private async ensureUniqueSlug(baseSlug: string) {
    const normalized = normalizeSlug(baseSlug) || 'topic';

    const existing = await this.prisma.testTopic.findMany({
      where: {
        slug: {
          startsWith: normalized,
        },
      },
      select: { slug: true },
    });

    const used = new Set(existing.map((item) => item.slug));

    if (!used.has(normalized)) {
      return normalized;
    }

    let index = 2;
    while (used.has(`${normalized}-${index}`)) {
      index += 1;
    }

    return `${normalized}-${index}`;
  }

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
    await this.ensureAdminAccess(userId);

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
          publishedVersionNumber:
            topic.activePublishedVersion?.versionNumber ?? null,
          publishedTitle: topic.activePublishedVersion?.title ?? null,
          updatedAt: topic.updatedAt.toISOString(),
        })),
    };
  }

  async createTopic(
    userId: number,
    dto: CreateTestsTopicDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const baseSlug = dto.slug ?? dto.title;
    const slug = await this.ensureUniqueSlug(baseSlug);

    const topicId = await this.prisma.$transaction(async (tx) => {
      const topic = await tx.testTopic.create({
        data: {
          slug,
        },
      });

      const draft = await tx.testTopicVersion.create({
        data: {
          topicId: topic.id,
          versionNumber: 1,
          status: 'DRAFT',
          title: dto.title,
          description: dto.description ?? null,
        },
      });

      await tx.testTopic.update({
        where: { id: topic.id },
        data: {
          activeDraftVersionId: draft.id,
        },
      });

      return topic.id;
    });

    return this.getTopicDraft(userId, topicId);
  }

  async createTopicFromAi(
    userId: number,
    dto: CreateTestsTopicFromAiDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const baseSlug = dto.slug ?? dto.title;
    const slug = await this.ensureUniqueSlug(baseSlug);
    const questionPayloads = dto.questions.map((question, index) => {
      const payload = prepareQuestionPayload(question);
      const questionLabel = `Question #${index + 1}`;

      if (
        (payload.type === 'SINGLE_CHOICE' || payload.type === 'MULTI_CHOICE') &&
        payload.options.length < 2
      ) {
        throw new BadRequestException(
          `${questionLabel} requires at least two options`,
        );
      }

      if (payload.type === 'SLIDER') {
        if (payload.sliderBands.length === 0) {
          throw new BadRequestException(
            `${questionLabel} requires at least one slider band`,
          );
        }

        const sliderSettings = parseSliderSettings(payload.settings);
        if (!sliderSettings) {
          throw new BadRequestException(
            `${questionLabel} has invalid slider settings`,
          );
        }
      }

      return payload;
    });

    const topicId = await this.prisma.$transaction(async (tx) => {
      const topic = await tx.testTopic.create({
        data: {
          slug,
        },
      });

      const draft = await tx.testTopicVersion.create({
        data: {
          topicId: topic.id,
          versionNumber: 1,
          status: 'DRAFT',
          title: dto.title,
          description: dto.description ?? null,
        },
      });

      await tx.testTopic.update({
        where: { id: topic.id },
        data: {
          activeDraftVersionId: draft.id,
        },
      });

      for (const [index, question] of questionPayloads.entries()) {
        const createdQuestion = await tx.testQuestion.create({
          data: {
            versionId: draft.id,
            type: question.type,
            title: question.title,
            description: question.description,
            required: question.required,
            order: index + 1,
            ...(question.settings !== undefined
              ? { settings: toPrismaSettingsInput(question.settings) }
              : {}),
          },
        });

        if (question.options.length > 0) {
          await tx.testQuestionOption.createMany({
            data: question.options.map((option) => ({
              questionId: createdQuestion.id,
              label: option.label,
              value: option.value,
              weight: option.weight,
              order: option.order,
            })),
          });
        }

        if (question.sliderBands.length > 0) {
          await tx.testQuestionSliderBand.createMany({
            data: question.sliderBands.map((band) => ({
              questionId: createdQuestion.id,
              minValue: band.minValue,
              maxValue: band.maxValue,
              label: band.label,
              weight: band.weight,
              order: band.order,
            })),
          });
        }
      }

      return topic.id;
    });

    return this.getTopicDraft(userId, topicId);
  }

  async deleteTopic(
    userId: number,
    topicId: number,
  ): Promise<DeleteTestsTopicResponseDto> {
    await this.ensureAdminAccess(userId);

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

  async getTopicDraft(
    userId: number,
    topicId: number,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

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
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);

    await this.prisma.testTopicVersion.update({
      where: { id: topic.activeDraftVersion.id },
      data: {
        title: dto.title ?? topic.activeDraftVersion.title,
        description:
          dto.description !== undefined
            ? dto.description
            : topic.activeDraftVersion.description,
      },
    });

    return this.getTopicDraft(userId, topicId);
  }

  async createQuestion(
    userId: number,
    topicId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.createQuestion(
      topic.activeDraftVersion,
      dto,
    );

    return this.getTopicDraft(userId, topicId);
  }

  async updateQuestion(
    userId: number,
    topicId: number,
    questionId: number,
    dto: UpsertTestsQuestionDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.updateQuestion(
      topic.activeDraftVersion,
      questionId,
      dto,
    );

    return this.getTopicDraft(userId, topicId);
  }

  async deleteQuestion(
    userId: number,
    topicId: number,
    questionId: number,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.deleteQuestion(
      topic.activeDraftVersion,
      questionId,
    );

    return this.getTopicDraft(userId, topicId);
  }

  async reorderQuestions(
    userId: number,
    topicId: number,
    dto: ReorderTestsQuestionsDto,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    await this.testsQuestionService.reorderQuestions(
      topic.activeDraftVersion,
      dto,
    );

    return this.getTopicDraft(userId, topicId);
  }

  async publishTopic(
    userId: number,
    topicId: number,
  ): Promise<PublishTestsTopicResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    const draft = topic.activeDraftVersion;

    validateDraftForPublish(draft);

    return this.prisma.$transaction(async (tx) => {
      if (
        topic.activePublishedVersionId &&
        topic.activePublishedVersionId !== draft.id
      ) {
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

      for (const question of draft.questions) {
        const clonedQuestion = await tx.testQuestion.create({
          data: {
            versionId: newDraftVersion.id,
            type: question.type,
            title: question.title,
            description: question.description,
            required: question.required,
            order: question.order,
            ...(question.settings !== null
              ? { settings: toPrismaSettingsInput(question.settings) }
              : { settings: Prisma.JsonNull }),
          },
        });

        if (question.options.length > 0) {
          await tx.testQuestionOption.createMany({
            data: question.options.map((option) => ({
              questionId: clonedQuestion.id,
              label: option.label,
              value: option.value,
              weight: option.weight,
              order: option.order,
            })),
          });
        }

        if (question.sliderBands.length > 0) {
          await tx.testQuestionSliderBand.createMany({
            data: question.sliderBands.map((band) => ({
              questionId: clonedQuestion.id,
              minValue: band.minValue,
              maxValue: band.maxValue,
              label: band.label,
              weight: band.weight,
              order: band.order,
            })),
          });
        }
      }

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
