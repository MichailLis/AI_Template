import type { PublicTestAnswerDraft, PublicTestQuestion } from './public-test-run.types';

export const hasMeaningfulQuestionAnswer = (
  questionType: PublicTestQuestion['type'],
  value: unknown,
) => {
  if (questionType === 'SLIDER') {
    return typeof value === 'number' && Number.isFinite(value);
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== null;
};

export const getEffectiveQuestionAnswer = (
  question: PublicTestQuestion,
  mergedAnswers: PublicTestAnswerDraft,
) => {
  return mergedAnswers[question.id];
};

export const buildSessionAnswers = (
  questions: PublicTestQuestion[],
  mergedAnswers: PublicTestAnswerDraft,
) =>
  questions
    .map((question) => ({
      questionId: question.id,
      answerPayload: getEffectiveQuestionAnswer(question, mergedAnswers),
    }))
    .filter((item) => item.answerPayload !== undefined);
