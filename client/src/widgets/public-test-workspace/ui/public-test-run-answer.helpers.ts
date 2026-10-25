import type { PublicTestAnswerDraft, PublicTestQuestion } from './public-test-run.types';

type PublicTestAnswerPayload = string | string[] | number;

const isPublicTestAnswerPayload = (value: unknown): value is PublicTestAnswerPayload => {
  return (
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value)) ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
};

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

// A question the server holds an answer for but the draft has emptied goes out as null (erase).
export const buildSessionAnswers = (
  questions: PublicTestQuestion[],
  mergedAnswers: PublicTestAnswerDraft,
  serverAnswerMap: PublicTestAnswerDraft = {},
) =>
  questions.reduce<Array<{ questionId: number; answerPayload: PublicTestAnswerPayload | null }>>(
    (answers, question) => {
      const answerPayload = getEffectiveQuestionAnswer(question, mergedAnswers);

      if (!hasMeaningfulQuestionAnswer(question.type, answerPayload)) {
        if (hasMeaningfulQuestionAnswer(question.type, serverAnswerMap[question.id])) {
          answers.push({ questionId: question.id, answerPayload: null });
        }
        return answers;
      }

      if (!isPublicTestAnswerPayload(answerPayload)) {
        return answers;
      }

      answers.push({
        questionId: question.id,
        answerPayload,
      });
      return answers;
    },
    [],
  );

export const reconcileAnswerDraftAfterSave = (
  answerDraft: PublicTestAnswerDraft,
  savedAnswers: Array<{ questionId: number; answerPayload: PublicTestAnswerPayload }>,
) => {
  if (savedAnswers.length === 0) {
    return answerDraft;
  }

  return savedAnswers.reduce<PublicTestAnswerDraft>(
    (nextDraft, answer) => ({
      ...nextDraft,
      [answer.questionId]: answer.answerPayload,
    }),
    { ...answerDraft },
  );
};
