import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { TestQuestionType } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type {
  CreateTestsTopicDto,
  PublishTestsTopicResponseDto,
  TestsTopicDetailResponseDto,
  TestsTopicListResponseDto,
  UpdateTestsTopicDraftDto,
  UpsertTestsQuestionDto,
} from './dto/tests.dto';

@Injectable()
export class TestsService {
  constructor(private readonly prisma: PrismaService) {}

  private isInputJsonValue(value: unknown): value is Prisma.InputJsonValue {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return true;
    }

    if (Array.isArray(value)) {
      return value.every(
        (item) => item === null || this.isInputJsonValue(item),
      );
    }

    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(
        (item) => item === null || this.isInputJsonValue(item),
      );
    }

    return false;
  }

  private toPrismaSettingsInput(
    value: unknown,
  ): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return Prisma.JsonNull;
    }

    if (!this.isInputJsonValue(value)) {
      throw new BadRequestException('Question settings must be valid JSON');
    }

    return value;
  }

  private async ensureAdminAccess(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }
  }

  private normalizeSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 120);
  }

  private async ensureUniqueSlug(baseSlug: string) {
    const normalized = this.normalizeSlug(baseSlug) || 'topic';

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

  private parseSliderSettings(settings: unknown) {
    if (typeof settings !== 'object' || settings === null) {
      return null;
    }

    const record = settings as Record<string, unknown>;
    const min = typeof record.min === 'number' ? record.min : null;
    const max = typeof record.max === 'number' ? record.max : null;
    const step = typeof record.step === 'number' ? record.step : null;

    if (min === null || max === null || step === null) {
      return null;
    }

    if (
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      !Number.isFinite(step)
    ) {
      return null;
    }

    if (max <= min || step <= 0) {
      return null;
    }

    return { min, max, step };
  }

  private mapQuestion(question: {
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
      weight: number;
      order: number;
    }>;
    sliderBands: Array<{
      id: number;
      minValue: number;
      maxValue: number;
      label: string;
      weight: number;
      order: number;
    }>;
  }) {
    return {
      id: question.id,
      type: question.type,
      title: question.title,
      description: question.description,
      required: question.required,
      order: question.order,
      settings: question.settings ?? null,
      options: question.options,
      sliderBands: question.sliderBands,
    };
  }

  private validateDraftForPublish(draft: {
    questions: Array<{
      type: TestQuestionType;
      title: string;
      order: number;
      settings: unknown;
      options: Array<{ id: number }>;
      sliderBands: Array<{ minValue: number; maxValue: number }>;
    }>;
  }) {
    if (draft.questions.length === 0) {
      throw new BadRequestException(
        'Draft must contain at least one question before publish',
      );
    }

    const seenOrder = new Set<number>();

    for (const question of draft.questions) {
      if (seenOrder.has(question.order)) {
        throw new BadRequestException(
          'Questions order must be unique within draft',
        );
      }
      seenOrder.add(question.order);

      if (
        question.type === 'SINGLE_CHOICE' ||
        question.type === 'MULTI_CHOICE'
      ) {
        if (question.options.length < 2) {
          throw new BadRequestException(
            `Question "${question.title}" requires at least two options`,
          );
        }
      }

      if (question.type === 'SLIDER') {
        const sliderSettings = this.parseSliderSettings(question.settings);

        if (!sliderSettings) {
          throw new BadRequestException(
            `Slider question "${question.title}" has invalid settings`,
          );
        }

        for (const band of question.sliderBands) {
          if (band.maxValue < band.minValue) {
            throw new BadRequestException(
              `Slider question "${question.title}" has invalid score range`,
            );
          }
        }
      }
    }
  }

  private prepareQuestionPayload(dto: UpsertTestsQuestionDto) {
    const options =
      dto.type === 'SINGLE_CHOICE' || dto.type === 'MULTI_CHOICE'
        ? (dto.options ?? []).map((option, index) => ({
            label: option.label,
            value: option.value,
            weight: option.weight,
            order: index + 1,
          }))
        : [];

    const sliderBands =
      dto.type === 'SLIDER'
        ? (dto.sliderBands ?? []).map((band, index) => {
            if (band.maxValue < band.minValue) {
              throw new BadRequestException(
                'Slider band maxValue must be greater than or equal to minValue',
              );
            }

            return {
              minValue: band.minValue,
              maxValue: band.maxValue,
              label: band.label,
              weight: band.weight,
              order: index + 1,
            };
          })
        : [];

    return {
      type: dto.type,
      title: dto.title,
      description: dto.description ?? null,
      required: dto.required,
      settings: dto.settings,
      options,
      sliderBands,
    };
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
        questions: draft.questions.map((question) =>
          this.mapQuestion(question),
        ),
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
    const draft = topic.activeDraftVersion;
    const payload = this.prepareQuestionPayload(dto);
    const nextOrder =
      draft.questions.length > 0
        ? Math.max(...draft.questions.map((question) => question.order)) + 1
        : 1;

    await this.prisma.$transaction(async (tx) => {
      const createdQuestion = await tx.testQuestion.create({
        data: {
          versionId: draft.id,
          type: payload.type,
          title: payload.title,
          description: payload.description,
          required: payload.required,
          order: nextOrder,
          ...(payload.settings !== undefined
            ? { settings: this.toPrismaSettingsInput(payload.settings) }
            : {}),
        },
      });

      if (payload.options.length > 0) {
        await tx.testQuestionOption.createMany({
          data: payload.options.map((option) => ({
            questionId: createdQuestion.id,
            label: option.label,
            value: option.value,
            weight: option.weight,
            order: option.order,
          })),
        });
      }

      if (payload.sliderBands.length > 0) {
        await tx.testQuestionSliderBand.createMany({
          data: payload.sliderBands.map((band) => ({
            questionId: createdQuestion.id,
            minValue: band.minValue,
            maxValue: band.maxValue,
            label: band.label,
            weight: band.weight,
            order: band.order,
          })),
        });
      }
    });

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
    const draft = topic.activeDraftVersion;
    const existingQuestion = draft.questions.find(
      (question) => question.id === questionId,
    );

    if (!existingQuestion) {
      throw new NotFoundException('Question not found in active draft');
    }

    const payload = this.prepareQuestionPayload(dto);

    await this.prisma.$transaction(async (tx) => {
      await tx.testQuestion.update({
        where: { id: questionId },
        data: {
          type: payload.type,
          title: payload.title,
          description: payload.description,
          required: payload.required,
          ...(payload.settings !== undefined
            ? { settings: this.toPrismaSettingsInput(payload.settings) }
            : { settings: Prisma.JsonNull }),
        },
      });

      await tx.testQuestionOption.deleteMany({
        where: { questionId },
      });
      await tx.testQuestionSliderBand.deleteMany({
        where: { questionId },
      });

      if (payload.options.length > 0) {
        await tx.testQuestionOption.createMany({
          data: payload.options.map((option) => ({
            questionId,
            label: option.label,
            value: option.value,
            weight: option.weight,
            order: option.order,
          })),
        });
      }

      if (payload.sliderBands.length > 0) {
        await tx.testQuestionSliderBand.createMany({
          data: payload.sliderBands.map((band) => ({
            questionId,
            minValue: band.minValue,
            maxValue: band.maxValue,
            label: band.label,
            weight: band.weight,
            order: band.order,
          })),
        });
      }
    });

    return this.getTopicDraft(userId, topicId);
  }

  async deleteQuestion(
    userId: number,
    topicId: number,
    questionId: number,
  ): Promise<TestsTopicDetailResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    const draft = topic.activeDraftVersion;
    const existingQuestion = draft.questions.find(
      (question) => question.id === questionId,
    );

    if (!existingQuestion) {
      throw new NotFoundException('Question not found in active draft');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.testQuestion.delete({
        where: {
          id: questionId,
        },
      });

      const remaining = await tx.testQuestion.findMany({
        where: { versionId: draft.id },
        orderBy: { order: 'asc' },
        select: { id: true },
      });

      for (const [index, question] of remaining.entries()) {
        await tx.testQuestion.update({
          where: { id: question.id },
          data: { order: index + 1 },
        });
      }
    });

    return this.getTopicDraft(userId, topicId);
  }

  async publishTopic(
    userId: number,
    topicId: number,
  ): Promise<PublishTestsTopicResponseDto> {
    await this.ensureAdminAccess(userId);

    const topic = await this.getTopicSnapshot(topicId);
    const draft = topic.activeDraftVersion;

    this.validateDraftForPublish(draft);

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
              ? { settings: this.toPrismaSettingsInput(question.settings) }
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
