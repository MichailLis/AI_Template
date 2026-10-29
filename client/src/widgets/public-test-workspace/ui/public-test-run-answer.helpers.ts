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

const isSameAnswer = (left: unknown, right: unknown) =>
  Array.isArray(left) && Array.isArray(right)
    ? left.length === right.length && left.every((item, index) => item === right[index])
    : left === right;

// Only answers that differ from the server's copy go out, so a stale tab cannot overwrite them.
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

      if (
        !isPublicTestAnswerPayload(answerPayload) ||
        isSameAnswer(answerPayload, serverAnswerMap[question.id])
      ) {
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

// Черновик хранит только несохранённые правки: сохранённое берётся с сервера, иначе вторая
// вкладка держала бы старый ответ в черновике и откатывала правки первой.
export const dropSavedDraftEntries = (
  answerDraft: PublicTestAnswerDraft,
  sentAnswers: PublicTestAnswerDraft,
) =>
  Object.fromEntries(
    Object.entries(answerDraft).filter(
      ([questionId, value]) => !isSameAnswer(value, sentAnswers[Number(questionId)]),
    ),
  );
