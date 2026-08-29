import { BadRequestException, Injectable } from '@nestjs/common';
import type { TestQuestionType } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import {
  mapQuestionToPromptPayload,
  type TestsPromptQuestionPayload,
} from '../analysis/prompt-payload.utils';

export type TestsPromptSimulationQuestionPayload = TestsPromptQuestionPayload;

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

    return questions.map(mapQuestionToPromptPayload);
  }
}
