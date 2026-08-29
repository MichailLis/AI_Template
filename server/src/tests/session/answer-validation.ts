import { BadRequestException } from '@nestjs/common';
import type { TestQuestionType } from '@prisma/client';

import { parseSliderSettings } from '../shared/domain.utils';

const OPEN_TEXT_MAX_LENGTH = 5000;
const STEP_EPSILON = 1e-9;

type PublicAnswerQuestion = {
  id: number;
  type: TestQuestionType;
  title?: string;
  required?: boolean;
  settings: unknown;
  options: Array<{ value: string }>;
};

type PublicAttemptAnswer = {
  questionId: number;
  answerPayload: unknown;
};

const getQuestionLabel = (question: PublicAnswerQuestion) =>
  question.title || `Question ${question.id}`;

const getMaxChoices = (settings: unknown) => {
  if (typeof settings !== 'object' || settings === null) {
    return null;
  }

  const value = (settings as Record<string, unknown>).maxChoices;
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null;
};

const assertKnownOption = (question: PublicAnswerQuestion, value: string) => {
  if (!question.options.some((option) => option.value === value)) {
    throw new BadRequestException(`${getQuestionLabel(question)} contains an unknown option`);
  }
};

const isAlignedToStep = (value: number, min: number, step: number) => {
  const steps = (value - min) / step;
  return Math.abs(Math.round(steps) - steps) < STEP_EPSILON;
};

export const validatePublicAnswerPayload = (
  question: PublicAnswerQuestion,
  answerPayload: unknown,
) => {
  if (question.type === 'OPEN_TEXT') {
    if (typeof answerPayload !== 'string') {
      throw new BadRequestException(`${getQuestionLabel(question)} expects a text answer`);
    }

    const normalizedText = answerPayload.trim();
    if (!normalizedText) {
      throw new BadRequestException(`${getQuestionLabel(question)} requires a non-empty answer`);
    }

    if (normalizedText.length > OPEN_TEXT_MAX_LENGTH) {
      throw new BadRequestException(`${getQuestionLabel(question)} answer is too long`);
    }

    return normalizedText;
  }

  if (question.type === 'SINGLE_CHOICE') {
    if (typeof answerPayload !== 'string' || !answerPayload.trim()) {
      throw new BadRequestException(`${getQuestionLabel(question)} expects a single option`);
    }

    assertKnownOption(question, answerPayload);
    return answerPayload;
  }

  if (question.type === 'MULTI_CHOICE') {
    if (!Array.isArray(answerPayload) || answerPayload.length === 0) {
      throw new BadRequestException(`${getQuestionLabel(question)} expects one or more options`);
    }

    const uniqueValues = new Set<string>();
    const selectedValues: string[] = [];
    for (const value of answerPayload as unknown[]) {
      if (typeof value !== 'string' || !value.trim()) {
        throw new BadRequestException(`${getQuestionLabel(question)} expects string options`);
      }

      if (uniqueValues.has(value)) {
        throw new BadRequestException(`${getQuestionLabel(question)} contains duplicate options`);
      }

      assertKnownOption(question, value);
      uniqueValues.add(value);
      selectedValues.push(value);
    }

    const maxChoices = getMaxChoices(question.settings);
    if (maxChoices !== null && selectedValues.length > maxChoices) {
      throw new BadRequestException(`${getQuestionLabel(question)} has too many selected options`);
    }

    return selectedValues;
  }

  if (question.type === 'SLIDER') {
    if (typeof answerPayload !== 'number' || !Number.isFinite(answerPayload)) {
      throw new BadRequestException(`${getQuestionLabel(question)} expects a numeric answer`);
    }

    const settings = parseSliderSettings(question.settings);
    if (!settings) {
      throw new BadRequestException(`${getQuestionLabel(question)} has invalid slider settings`);
    }

    if (answerPayload < settings.min || answerPayload > settings.max) {
      throw new BadRequestException(`${getQuestionLabel(question)} is outside the allowed range`);
    }

    if (!isAlignedToStep(answerPayload, settings.min, settings.step)) {
      throw new BadRequestException(`${getQuestionLabel(question)} does not match slider step`);
    }

    return answerPayload;
  }

  throw new BadRequestException(`${getQuestionLabel(question)} has unsupported question type`);
};

export const validatePublicAttemptAnswersForFinish = (
  questions: PublicAnswerQuestion[],
  answers: PublicAttemptAnswer[],
) => {
  const questionMap = new Map(questions.map((question) => [question.id, question]));
  const answeredQuestionIds = new Set<number>();

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) {
      throw new BadRequestException(
        `Question ${answer.questionId} does not belong to this session`,
      );
    }

    validatePublicAnswerPayload(question, answer.answerPayload);
    answeredQuestionIds.add(answer.questionId);
  }

  const missingRequiredQuestion = questions.find(
    (question) => question.required === true && !answeredQuestionIds.has(question.id),
  );

  if (missingRequiredQuestion) {
    throw new BadRequestException(`${getQuestionLabel(missingRequiredQuestion)} is required`);
  }
};
