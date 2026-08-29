import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PublicQuestionChoiceGroup } from './public-question-choice-group';

import type { PublicTestQuestionOption } from './public-test-run.types';

const options = [
  { id: 1, value: 'a', label: 'Первый' },
  { id: 2, value: 'b', label: 'Второй' },
  { id: 3, value: 'c', label: 'Третий' },
] as PublicTestQuestionOption[];

const onAnswerChange = vi.fn();

const renderGroup = (currentAnswer: unknown, settings?: unknown) =>
  render(
    <PublicQuestionChoiceGroup
      mode="multi"
      questionId={7}
      options={options}
      currentAnswer={currentAnswer}
      settings={settings}
      onAnswerChange={onAnswerChange}
    />,
  );

const optionBox = (label: string) => screen.getByLabelText(label);

describe('PublicQuestionChoiceGroup, multi choice limit', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it('leaves every option selectable when settings carry no cap', async () => {
    renderGroup(['a', 'b']);

    expect(screen.queryByText(/из/)).not.toBeInTheDocument();
    await userEvent.click(optionBox('Третий'));

    expect(onAnswerChange).toHaveBeenCalledWith(7, ['a', 'b', 'c']);
  });

  it('shows how many of the allowed choices are used', () => {
    renderGroup(['a'], { maxChoices: 2 });

    expect(screen.getByText('Выбрано 1 из 2')).toBeInTheDocument();
  });

  // The server rejects an over-long answer, so a template that lets the student exceed the
  // cap produces a rejection they had no way to anticipate.
  it('disables unselected options once the cap is reached', () => {
    renderGroup(['a', 'b'], { maxChoices: 2 });

    expect(optionBox('Третий')).toBeDisabled();
    expect(optionBox('Первый')).toBeEnabled();
    expect(optionBox('Второй')).toBeEnabled();
  });

  it('does not report an answer change for a capped-out option', async () => {
    renderGroup(['a', 'b'], { maxChoices: 2 });

    await userEvent.click(optionBox('Третий'));

    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('still allows deselecting at the cap', async () => {
    renderGroup(['a', 'b'], { maxChoices: 2 });

    await userEvent.click(optionBox('Первый'));

    expect(onAnswerChange).toHaveBeenCalledWith(7, ['b']);
  });
});
