import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PolusPublicQuestionCard } from './polus-public-question-card';

import type { PublicTestQuestion } from '../public-test-run.types';

const singleChoiceQuestion = {
  id: 1,
  type: 'SINGLE_CHOICE',
  title: 'Что интереснее разобрать в задаче?',
  description: 'Выберите близкий вариант.',
  required: true,
  order: 1,
  settings: null,
  sliderBands: [],
  options: [
    { id: 11, value: 'system', label: 'Как устроена система', order: 1 },
    { id: 12, value: 'prototype', label: 'Как собрать прототип', order: 2 },
  ],
} as PublicTestQuestion;

const openTextQuestion = {
  id: 2,
  type: 'OPEN_TEXT',
  title: 'Что хочется попробовать?',
  description: null,
  required: true,
  order: 2,
  settings: null,
  sliderBands: [],
  options: [],
} as PublicTestQuestion;

afterEach(() => {
  cleanup();
});

function OpenTextHarness({
  onAnswerChange,
  onNext,
}: {
  onAnswerChange: (questionId: number, value: unknown) => void;
  onNext: () => void;
}) {
  const [answer, setAnswer] = useState('');

  return (
    <PolusPublicQuestionCard
      question={openTextQuestion}
      currentAnswer={answer}
      currentQuestionIndex={1}
      totalQuestionsCount={3}
      isLastQuestion={false}
      isSubmitting={false}
      canGoBack
      onAnswerChange={(questionId, value) => {
        setAnswer(typeof value === 'string' ? value : '');
        onAnswerChange(questionId, value);
      }}
      onBack={vi.fn()}
      onNext={onNext}
      onFinish={vi.fn()}
    />
  );
}

describe('PolusPublicQuestionCard', () => {
  it('auto-advances after a single-choice answer', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();
    const onNext = vi.fn();

    render(
      <PolusPublicQuestionCard
        question={singleChoiceQuestion}
        currentAnswer={undefined}
        currentQuestionIndex={0}
        totalQuestionsCount={2}
        isLastQuestion={false}
        isSubmitting={false}
        canGoBack={false}
        onAnswerChange={onAnswerChange}
        onBack={vi.fn()}
        onNext={onNext}
        onFinish={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /как устроена система/i }));

    expect(onAnswerChange).toHaveBeenCalledWith(1, 'system');
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('waits for an explicit action on open text questions', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();
    const onNext = vi.fn();

    render(<OpenTextHarness onAnswerChange={onAnswerChange} onNext={onNext} />);

    await user.type(screen.getByLabelText(/ответ/i), 'Собрать макет');

    expect(onAnswerChange).toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /далее/i }));

    expect(onNext).toHaveBeenCalledOnce();
  });
});
