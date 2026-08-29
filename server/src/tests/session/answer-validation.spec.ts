import { BadRequestException } from '@nestjs/common';

import {
  validatePublicAnswerPayload,
  validatePublicAttemptAnswersForFinish,
} from '../session/answer-validation';

const createQuestion = (overrides: Partial<Parameters<typeof validatePublicAnswerPayload>[0]>) => ({
  id: 1,
  type: 'OPEN_TEXT' as const,
  title: 'Question 1',
  required: true,
  settings: null,
  options: [],
  ...overrides,
});

describe('tests answer validation', () => {
  it('normalizes valid public answer payloads by question type', () => {
    expect(validatePublicAnswerPayload(createQuestion({ type: 'OPEN_TEXT' }), '  text  ')).toBe(
      'text',
    );
    expect(
      validatePublicAnswerPayload(
        createQuestion({
          type: 'SINGLE_CHOICE',
          options: [{ value: 'A' }, { value: 'B' }],
        }),
        'A',
      ),
    ).toBe('A');
    expect(
      validatePublicAnswerPayload(
        createQuestion({
          type: 'MULTI_CHOICE',
          settings: { maxChoices: 2 },
          options: [{ value: 'A' }, { value: 'B' }, { value: 'C' }],
        }),
        ['A', 'B'],
      ),
    ).toEqual(['A', 'B']);
    expect(
      validatePublicAnswerPayload(
        createQuestion({
          type: 'SLIDER',
          settings: { min: 0, max: 10, step: 2 },
        }),
        4,
      ),
    ).toBe(4);
  });

  it('rejects invalid choice, duplicate multi-choice, and slider payloads', () => {
    expect(() =>
      validatePublicAnswerPayload(
        createQuestion({
          type: 'SINGLE_CHOICE',
          options: [{ value: 'A' }],
        }),
        'Z',
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      validatePublicAnswerPayload(
        createQuestion({
          type: 'MULTI_CHOICE',
          options: [{ value: 'A' }, { value: 'B' }],
        }),
        ['A', 'A'],
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      validatePublicAnswerPayload(
        createQuestion({
          type: 'SLIDER',
          settings: { min: 0, max: 10, step: 2 },
        }),
        5,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects finish when required questions are missing or invalid', () => {
    const questions = [
      createQuestion({ id: 1, type: 'OPEN_TEXT', required: true }),
      createQuestion({
        id: 2,
        type: 'SINGLE_CHOICE',
        required: true,
        options: [{ value: 'A' }],
      }),
    ];

    expect(() =>
      validatePublicAttemptAnswersForFinish(questions, [{ questionId: 1, answerPayload: 'Ready' }]),
    ).toThrow(BadRequestException);

    expect(() =>
      validatePublicAttemptAnswersForFinish(questions, [
        { questionId: 1, answerPayload: 'Ready' },
        { questionId: 2, answerPayload: 'Z' },
      ]),
    ).toThrow(BadRequestException);

    expect(() =>
      validatePublicAttemptAnswersForFinish(questions, [
        { questionId: 1, answerPayload: 'Ready' },
        { questionId: 2, answerPayload: 'A' },
      ]),
    ).not.toThrow();
  });
});
