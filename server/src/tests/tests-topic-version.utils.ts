import { BadRequestException } from '@nestjs/common';
import type { Prisma, TestQuestionType } from '@prisma/client';

import type { CreateTestsTopicFromAiDto } from './dto/tests.dto';
import {
  parseSliderSettings,
  prepareQuestionPayload,
  toPrismaSettingsInput,
} from './tests-domain.utils';

type TransactionClient = Prisma.TransactionClient;

interface QuestionOptionPayload {
  label: string;
  value: string;
  weight: number;
  order: number;
}

interface QuestionSliderBandPayload {
  minValue: number;
  maxValue: number;
  label: string;
  weight: number;
  order: number;
}

export interface PersistQuestionPayload {
  type: TestQuestionType;
  title: string;
  description: string | null;
  required: boolean;
  settings: unknown;
  options: QuestionOptionPayload[];
  sliderBands: QuestionSliderBandPayload[];
  order?: number;
}

export const createQuestionChildren = async (
  tx: TransactionClient,
  questionId: number,
  question: Pick<PersistQuestionPayload, 'options' | 'sliderBands'>,
) => {
  if (question.options.length > 0) {
    await tx.testQuestionOption.createMany({
      data: question.options.map((option) => ({
        questionId,
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
        questionId,
        minValue: band.minValue,
        maxValue: band.maxValue,
        label: band.label,
        weight: band.weight,
        order: band.order,
      })),
    });
  }
};

export const createTopicWithDraft = async (
  tx: TransactionClient,
  input: {
    slug: string;
    title: string;
    description: string | null;
    analysisPromptVersionId?: number | null;
    scoringKind?: 'DEFAULT' | 'PROF_ORIENTATION_V3_PLUS';
    scoringConfig?: unknown;
  },
) => {
  const topic = await tx.testTopic.create({
    data: {
      slug: input.slug,
    },
  });

  const draft = await tx.testTopicVersion.create({
    data: {
      topicId: topic.id,
      versionNumber: 1,
      status: 'DRAFT',
      title: input.title,
      description: input.description,
      analysisPromptVersionId: input.analysisPromptVersionId,
      scoringKind: input.scoringKind,
      ...(input.scoringConfig !== undefined
        ? { scoringConfig: toPrismaSettingsInput(input.scoringConfig) }
        : {}),
    },
  });

  await tx.testTopic.update({
    where: { id: topic.id },
    data: {
      activeDraftVersionId: draft.id,
    },
  });

  return {
    topicId: topic.id,
    draftVersionId: draft.id,
  };
};

export const buildAiQuestionPayloads = (questions: CreateTestsTopicFromAiDto['questions']) => {
  return questions.map((question, index) => {
    const payload = prepareQuestionPayload(question);
    const questionLabel = `Question #${index + 1}`;

    if (
      (payload.type === 'SINGLE_CHOICE' || payload.type === 'MULTI_CHOICE') &&
      payload.options.length < 2
    ) {
      throw new BadRequestException(`${questionLabel} requires at least two options`);
    }

    if (payload.type === 'SLIDER') {
      if (payload.sliderBands.length === 0) {
        throw new BadRequestException(`${questionLabel} requires at least one slider band`);
      }

      const sliderSettings = parseSliderSettings(payload.settings);
      if (!sliderSettings) {
        throw new BadRequestException(`${questionLabel} has invalid slider settings`);
      }
    }

    return payload;
  });
};

export const createQuestionsInVersion = async (
  tx: TransactionClient,
  versionId: number,
  questions: PersistQuestionPayload[],
) => {
  for (const [index, question] of questions.entries()) {
    const createdQuestion = await tx.testQuestion.create({
      data: {
        versionId,
        type: question.type,
        title: question.title,
        description: question.description,
        required: question.required,
        order: question.order ?? index + 1,
        ...(question.settings !== undefined
          ? { settings: toPrismaSettingsInput(question.settings) }
          : {}),
      },
    });

    await createQuestionChildren(tx, createdQuestion.id, question);
  }
};

export const cloneQuestionsToVersion = async (
  tx: TransactionClient,
  targetVersionId: number,
  questions: Array<{
    type: TestQuestionType;
    title: string;
    description: string | null;
    required: boolean;
    order: number;
    settings: unknown;
    options: QuestionOptionPayload[];
    sliderBands: QuestionSliderBandPayload[];
  }>,
) => {
  await createQuestionsInVersion(
    tx,
    targetVersionId,
    questions.map((question) => ({
      type: question.type,
      title: question.title,
      description: question.description,
      required: question.required,
      order: question.order,
      settings: question.settings,
      options: question.options,
      sliderBands: question.sliderBands,
    })),
  );
};
