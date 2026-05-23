import { BadRequestException, Injectable } from '@nestjs/common';
import type { TestQuestionType } from '@prisma/client';

import { PrismaService } from '../prisma.service';

export interface TestsPromptSimulationQuestionPayload {
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
}

export interface TestsPromptSimulationTestReadModel {
  id: number;
  topicId: number;
  topicSlug: string;
  title: string;
  description: string | null;
  versionNumber: number;
  versionStatus: string;
  questionCount: number;
  questions: Array<{
    id: number;
    type: TestQuestionType;
    title: string;
    description: string | null;
  }>;
}

@Injectable()
export class TestsPromptSimulationReadService {
  constructor(private readonly prisma: PrismaService) {}

  async listPromptSimulationTests(): Promise<TestsPromptSimulationTestReadModel[]> {
    const testVersions = await this.prisma.testTopicVersion.findMany({
      where: {
        status: {
          in: ['DRAFT', 'PUBLISHED'],
        },
        questions: {
          some: {},
        },
      },
      include: {
        topic: {
          select: {
            slug: true,
          },
        },
        questions: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
    });

    return testVersions.map((testVersion) => ({
      id: testVersion.id,
      topicId: testVersion.topicId,
      topicSlug: testVersion.topic.slug,
      title: testVersion.title,
      description: testVersion.description,
      versionNumber: testVersion.versionNumber,
      versionStatus: testVersion.status,
      questionCount: testVersion.questions.length,
      questions: testVersion.questions.map((question) => ({
        id: question.id,
        type: question.type,
        title: question.title,
        description: question.description,
      })),
    }));
  }

  async getPromptSimulationQuestionPayloads(
    questionIds: number[],
  ): Promise<TestsPromptSimulationQuestionPayload[]> {
    const uniqueQuestionIds = Array.from(new Set(questionIds));
    const questions = await this.prisma.testQuestion.findMany({
      where: { id: { in: uniqueQuestionIds } },
      orderBy: [{ versionId: 'asc' }, { order: 'asc' }],
      include: {
        options: { orderBy: { order: 'asc' } },
        sliderBands: { orderBy: { order: 'asc' } },
      },
    });

    if (questions.length !== uniqueQuestionIds.length) {
      throw new BadRequestException('Some selected test questions were not found');
    }

    return questions.map((question) => ({
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
  }
}
