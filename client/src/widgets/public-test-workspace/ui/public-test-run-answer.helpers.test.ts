import { describe, expect, it } from 'vitest';

import {
  buildSessionAnswers,
  hasMeaningfulQuestionAnswer,
  reconcileAnswerDraftAfterSave,
} from './public-test-run-answer.helpers';

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
      makeQuestion(5, 'OPEN_TEXT'),
      makeQuestion(6, 'SLIDER'),
    ];

    expect(
      buildSessionAnswers(questions, {
        1: 'option_a',
        2: ['option_a', 'option_b'],
        3: 7,
        5: { text: 'legacy payload' },
        6: Number.NaN,
      }),
    ).toEqual([
      { questionId: 1, answerPayload: 'option_a' },
      { questionId: 2, answerPayload: ['option_a', 'option_b'] },
      { questionId: 3, answerPayload: 7 },
    ]);
  });

  it('replaces saved draft values with canonical answer payloads returned by the server', () => {
    expect(
      reconcileAnswerDraftAfterSave(
        {
          1: '  local draft  ',
          2: ['a'],
          3: 'unsaved draft',
        },
        [
          {
            questionId: 1,
            answerPayload: 'local draft',
          },
          {
            questionId: 2,
            answerPayload: ['a', 'b'],
          },
        ],
      ),
    ).toEqual({
      1: 'local draft',
      2: ['a', 'b'],
      3: 'unsaved draft',
    });
  });
});
