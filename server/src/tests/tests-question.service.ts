import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type { ReorderTestsQuestionsDto, UpsertTestsQuestionDto } from './dto/tests.dto';
import { prepareQuestionPayload, toPrismaSettingsInput } from './tests-domain.utils';
import { createQuestionChildren } from './tests-topic-version.utils';

interface DraftQuestionRef {
  id: number;
  order: number;
}

interface DraftRef {
  id: number;
  questions: DraftQuestionRef[];
}

@Injectable()
export class TestsQuestionService {
  constructor(private readonly prisma: PrismaService) {}

  async createQuestion(draft: DraftRef, dto: UpsertTestsQuestionDto) {
    const payload = prepareQuestionPayload(dto);
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
            ? { settings: toPrismaSettingsInput(payload.settings) }
            : {}),
        },
      });

      await createQuestionChildren(tx, createdQuestion.id, payload);
    });
  }

  async updateQuestion(draft: DraftRef, questionId: number, dto: UpsertTestsQuestionDto) {
    const existingQuestion = draft.questions.find((question) => question.id === questionId);

    if (!existingQuestion) {
      throw new NotFoundException('Question not found in active draft');
    }

    const payload = prepareQuestionPayload(dto);

    await this.prisma.$transaction(async (tx) => {
      await tx.testQuestion.update({
        where: { id: questionId },
        data: {
          type: payload.type,
          title: payload.title,
          description: payload.description,
          required: payload.required,
          ...(payload.settings !== undefined
            ? { settings: toPrismaSettingsInput(payload.settings) }
            : { settings: Prisma.JsonNull }),
        },
      });

      await tx.testQuestionOption.deleteMany({
        where: { questionId },
      });
      await tx.testQuestionSliderBand.deleteMany({
        where: { questionId },
      });

      await createQuestionChildren(tx, questionId, payload);
    });
  }

  async deleteQuestion(draft: DraftRef, questionId: number) {
    const existingQuestion = draft.questions.find((question) => question.id === questionId);

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
  }

  async reorderQuestions(draft: DraftRef, dto: ReorderTestsQuestionsDto) {
    if (draft.questions.length === 0) {
      throw new BadRequestException('Draft has no questions to reorder');
    }

    if (dto.questionIds.length !== draft.questions.length) {
      throw new BadRequestException(
        'Reorder payload must include all draft question ids exactly once',
      );
    }

    const uniqueIds = new Set(dto.questionIds);
    if (uniqueIds.size !== dto.questionIds.length) {
      throw new BadRequestException('Reorder payload contains duplicate question ids');
    }

    const draftQuestionIds = new Set(draft.questions.map((question) => question.id));

    for (const questionId of dto.questionIds) {
      if (!draftQuestionIds.has(questionId)) {
        throw new BadRequestException(`Question ${questionId} does not belong to active draft`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      for (const [index, questionId] of dto.questionIds.entries()) {
        await tx.testQuestion.update({
          where: { id: questionId },
          data: { order: -(index + 1) },
        });
      }

      for (const [index, questionId] of dto.questionIds.entries()) {
        await tx.testQuestion.update({
          where: { id: questionId },
          data: { order: index + 1 },
        });
      }
    });
  }
}
