import type { TestQuestionType } from '@prisma/client';

export interface TestsPromptQuestionPayload {
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

export interface TestsPromptAnswerPayload {
  questionId: number;
  questionTitle: string;
  questionType: string;
  answerPayload: unknown;
}

interface PromptQuestionRecord {
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

interface PromptAnswerRecord {
  questionId: number;
  questionTitleSnapshot: string;
  questionTypeSnapshot: string;
  answerPayload: unknown;
}

export const mapQuestionToPromptPayload = (
  question: PromptQuestionRecord,
): TestsPromptQuestionPayload => ({
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
});

export const mapAnswerToPromptPayload = (answer: PromptAnswerRecord): TestsPromptAnswerPayload => ({
  questionId: answer.questionId,
  questionTitle: answer.questionTitleSnapshot,
  questionType: answer.questionTypeSnapshot,
  answerPayload: answer.answerPayload,
});
