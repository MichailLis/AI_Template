import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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

const multiChoiceQuestion = {
  id: 3,
  type: 'MULTI_CHOICE',
  title: 'Какие задачи ближе?',
  description: null,
  required: true,
  order: 3,
  settings: { maxChoices: 2 },
  sliderBands: [],
  options: [
    { id: 31, value: 'model', label: 'Моделировать', order: 1 },
    { id: 32, value: 'print', label: 'Печатать', order: 2 },
    { id: 33, value: 'fly', label: 'Управлять', order: 3 },
  ],
} as PublicTestQuestion;

const sliderQuestion = {
  id: 4,
  type: 'SLIDER',
  title: 'Насколько интересно создавать 3D-модели?',
  description: null,
  required: true,
  order: 4,
  settings: { min: 0, max: 10, step: 1, minLabel: 'Низко', maxLabel: 'Высоко' },
  sliderBands: [
    { id: 41, minValue: 0, maxValue: 3, label: 'Низко', order: 1 },
    { id: 42, minValue: 4, maxValue: 7, label: 'Средне', order: 2 },
    { id: 43, minValue: 8, maxValue: 10, label: 'Высоко', order: 3 },
  ],
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

  it('limits multi-choice answers by question maxChoices setting', async () => {
    const user = userEvent.setup();
    const onAnswerChange = vi.fn();

    function MultiChoiceHarness() {
      const [answer, setAnswer] = useState<unknown>([]);

      return (
        <PolusPublicQuestionCard
          question={multiChoiceQuestion}
          currentAnswer={answer}
          currentQuestionIndex={2}
          totalQuestionsCount={3}
          isLastQuestion={false}
          isSubmitting={false}
          canGoBack
          onAnswerChange={(questionId, value) => {
            setAnswer(value);
            onAnswerChange(questionId, value);
          }}
          onBack={vi.fn()}
          onNext={vi.fn()}
          onFinish={vi.fn()}
        />
      );
    }

    render(<MultiChoiceHarness />);

    await user.click(screen.getByRole('button', { name: /моделировать/i }));
    await user.click(screen.getByRole('button', { name: /печатать/i }));
    await user.click(screen.getByRole('button', { name: /управлять/i }));

    expect(screen.getByText('2 из 2')).toBeInTheDocument();
    expect(onAnswerChange).not.toHaveBeenLastCalledWith(3, ['model', 'print', 'fly']);
  });

  it('renders a Polus slider with scale labels without numeric shortcut buttons', () => {
    const onAnswerChange = vi.fn();

    render(
      <PolusPublicQuestionCard
        question={sliderQuestion}
        currentAnswer={undefined}
        currentQuestionIndex={3}
        totalQuestionsCount={4}
        isLastQuestion={false}
        isSubmitting={false}
        canGoBack
        onAnswerChange={onAnswerChange}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText('Выберите значение')).toBeInTheDocument();
    expect(screen.getByText('Низко')).toBeInTheDocument();
    expect(screen.getByText('Высоко')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Выбрать оценку 9' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('slider', { name: 'Оценка по шкале' }), {
      target: { value: '9' },
    });

    expect(onAnswerChange).toHaveBeenCalledWith(4, 9);
  });
});
