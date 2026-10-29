import { describe, expect, it } from 'vitest';

import {
  buildSessionAnswers,
  dropSavedDraftEntries,
  hasMeaningfulQuestionAnswer,
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
        4: '   ',
        5: { text: 'legacy payload' },
        6: Number.NaN,
      }),
    ).toEqual([
      { questionId: 1, answerPayload: 'option_a' },
      { questionId: 2, answerPayload: ['option_a', 'option_b'] },
      { questionId: 3, answerPayload: 7 },
    ]);
  });

  it('sends null for a question the server holds an answer for but the draft has emptied', () => {
    const questions = [
      makeQuestion(1, 'OPEN_TEXT'),
      makeQuestion(2, 'MULTI_CHOICE'),
      makeQuestion(3, 'OPEN_TEXT'),
    ];

    expect(
      buildSessionAnswers(questions, { 1: '  ', 2: [], 3: '' }, { 1: 'old', 2: ['a'] }),
    ).toEqual([
      { questionId: 1, answerPayload: null },
      { questionId: 2, answerPayload: null },
    ]);
  });

  it('sends only answers that differ from the server copy, so a stale tab cannot roll them back', () => {
    const questions = [
      makeQuestion(1, 'SINGLE_CHOICE'),
      makeQuestion(2, 'MULTI_CHOICE'),
      makeQuestion(3, 'SLIDER'),
    ];

    expect(
      buildSessionAnswers(
        questions,
        { 1: 'a', 2: ['x', 'y'], 3: 5 },
        { 1: 'a', 2: ['y', 'x'], 3: 5 },
      ),
    ).toEqual([{ questionId: 2, answerPayload: ['x', 'y'] }]);
  });

  it('drops only the draft entries that were not edited after they were sent', () => {
    expect(
      dropSavedDraftEntries(
        { 1: 'sent', 2: ['a'], 3: 'typed meanwhile' },
        { 1: 'sent', 2: ['a'], 3: 'old' },
      ),
    ).toEqual({ 3: 'typed meanwhile' });
  });
});
