import { describe, expect, it } from 'vitest';

import { buildSessionAnswers, hasMeaningfulQuestionAnswer } from './public-test-run-answer.helpers';

import type { PublicTestQuestion } from './public-test-run.types';

const makeQuestion = (id: number, type: PublicTestQuestion['type']): PublicTestQuestion =>
  ({
    id,
    type,
    title: `Question ${id}`,
    description: null,
    required: true,
    order: id,
    settings: null,
    options: [],
    sliderBands: [],
  }) as PublicTestQuestion;

describe('public test run answer helpers', () => {
  it('detects meaningful answers by question type', () => {
    expect(hasMeaningfulQuestionAnswer('SLIDER', 0)).toBe(true);
    expect(hasMeaningfulQuestionAnswer('SLIDER', Number.NaN)).toBe(false);
    expect(hasMeaningfulQuestionAnswer('OPEN_TEXT', '  text  ')).toBe(true);
    expect(hasMeaningfulQuestionAnswer('OPEN_TEXT', '   ')).toBe(false);
    expect(hasMeaningfulQuestionAnswer('MULTI_CHOICE', ['a'])).toBe(true);
    expect(hasMeaningfulQuestionAnswer('MULTI_CHOICE', [])).toBe(false);
  });

  it('builds answer payloads for choice and slider questions while skipping unanswered questions', () => {
    const questions = [
      makeQuestion(1, 'SINGLE_CHOICE'),
      makeQuestion(2, 'MULTI_CHOICE'),
      makeQuestion(3, 'SLIDER'),
      makeQuestion(4, 'OPEN_TEXT'),
    ];

    expect(
      buildSessionAnswers(questions, {
        1: 'option_a',
        2: ['option_a', 'option_b'],
        3: 7,
      }),
    ).toEqual([
      { questionId: 1, answerPayload: 'option_a' },
      { questionId: 2, answerPayload: ['option_a', 'option_b'] },
      { questionId: 3, answerPayload: 7 },
    ]);
  });
});
