import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicQuestionCard } from './public-question-card';

import type { PublicTestQuestion } from './public-test-run.types';

const singleChoiceQuestion = {
  id: 1,
  type: 'SINGLE_CHOICE',
  title: 'Что вам больше всего нравится делать?',
  description: null,
  required: true,
  order: 1,
  settings: null,
  sliderBands: [],
  options: [
    { id: 11, value: 'research', label: 'Исследовать и анализировать данные', order: 1 },
    { id: 12, value: 'create', label: 'Создавать визуальные материалы', order: 2 },
  ],
} as PublicTestQuestion;

const renderCard = (props: {
  currentAnswer: unknown;
  isLastQuestion?: boolean;
  canGoBack?: boolean;
  onAnswerChange?: (questionId: number, value: unknown) => void;
  onNext?: () => void;
  onFinish?: () => Promise<void>;
}) =>
  render(
    <PublicQuestionCard
      question={singleChoiceQuestion}
      currentAnswer={props.currentAnswer}
      isLastQuestion={props.isLastQuestion ?? false}
      isSubmitting={false}
      canGoBack={props.canGoBack ?? false}
      onAnswerChange={props.onAnswerChange ?? vi.fn()}
      onBack={vi.fn()}
      onNext={props.onNext ?? vi.fn()}
      onFinish={props.onFinish ?? vi.fn().mockResolvedValue(undefined)}
    />,
  );

/**
 * Находка доаудита FLOW-07: вернувшись в сессию, ученик видел сохраненный выбор на вопросе с одним
 * вариантом, но ни одной кнопки; повторный клик по выбранному варианту ничего не делал.
 */
describe('PublicQuestionCard single choice', () => {
  afterEach(cleanup);

  it('advances right after the first choice, without an extra button', async () => {
    const user = userEvent.setup();
    const onNext = vi.fn();

    renderCard({ currentAnswer: undefined, onNext });

    expect(screen.queryByRole('button', { name: /далее/i })).not.toBeInTheDocument();
    await user.click(screen.getByText('Исследовать и анализировать данные'));

    expect(onNext).toHaveBeenCalledOnce();
  });

  it('lets a returning student continue without changing the saved answer', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();
    const onNext = vi.fn();

    renderCard({ currentAnswer: 'research', onAnswerChange, onNext });

    await user.click(screen.getByRole('button', { name: /далее/i }));

    expect(onNext).toHaveBeenCalledOnce();
    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('lets a returning student finish on an answered last question', async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn().mockResolvedValue(undefined);

    renderCard({ currentAnswer: 'create', isLastQuestion: true, canGoBack: true, onFinish });

    await user.click(screen.getByRole('button', { name: /завершить тест/i }));

    expect(onFinish).toHaveBeenCalledOnce();
  });
});
