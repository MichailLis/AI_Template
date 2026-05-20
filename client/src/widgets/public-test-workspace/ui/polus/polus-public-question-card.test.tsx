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

const interestSliderQuestion = {
  ...sliderQuestion,
  id: 5,
  settings: {
    min: 0,
    max: 10,
    step: 1,
    methodologySliderId: 'S_A1',
    sliderKind: 'interest',
  },
} as PublicTestQuestion;

const precisionReadinessSliderQuestion = {
  ...sliderQuestion,
  id: 6,
  title: 'Насколько тебе подходит аккуратность: размеры, качество, измерения, документация?',
  settings: {
    min: 0,
    max: 10,
    step: 1,
    methodologySliderId: 'R_PRECISION',
    sliderKind: 'readiness',
  },
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
    expect(onAnswerChange).toHaveBeenLastCalledWith(3, ['model', 'print']);
    expect(onAnswerChange).not.toHaveBeenLastCalledWith(3, ['model', 'print', 'fly']);
  });

  it('keeps rapid multi-choice clicks in the same answer draft', () => {
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

    screen.getByRole('button', { name: /моделировать/i }).click();
    screen.getByRole('button', { name: /печатать/i }).click();

    expect(onAnswerChange).toHaveBeenLastCalledWith(3, ['model', 'print']);
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
    expect(screen.getByRole('slider', { name: 'Оценка по шкале' })).toHaveValue('5');

    fireEvent.change(screen.getByRole('slider', { name: 'Оценка по шкале' }), {
      target: { value: '9' },
    });

    expect(onAnswerChange).toHaveBeenCalledWith(4, 9);
  });

  it('uses human Polus scale labels for methodology interest sliders', () => {
    render(
      <PolusPublicQuestionCard
        question={interestSliderQuestion}
        currentAnswer={7}
        currentQuestionIndex={10}
        totalQuestionsCount={21}
        isLastQuestion={false}
        isSubmitting={false}
        canGoBack
        onAnswerChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText('Интерес')).toBeInTheDocument();
    expect(screen.getByText('Совсем не интересно')).toBeInTheDocument();
    expect(screen.getByText('Очень интересно')).toBeInTheDocument();
    expect(screen.getByText('Интересно')).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: 'Оценка интереса по шкале' });
    const sliderField = slider.closest('.polus-slider-field');

    expect(slider).toHaveValue('7');
    expect(sliderField).toHaveStyle({
      '--polus-slider-progress': '70%',
      '--polus-slider-active-color': 'rgb(187, 20, 96)',
      '--polus-slider-active-shadow': 'rgba(187, 20, 96, 0.26)',
    });
  });

  it('uses readiness wording and fixes the precision slider title', () => {
    render(
      <PolusPublicQuestionCard
        question={precisionReadinessSliderQuestion}
        currentAnswer={undefined}
        currentQuestionIndex={16}
        totalQuestionsCount={21}
        isLastQuestion={false}
        isSubmitting={false}
        canGoBack
        onAnswerChange={vi.fn()}
        onBack={vi.fn()}
        onNext={vi.fn()}
        onFinish={vi.fn()}
      />,
    );

    expect(screen.getByText('Готовность')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Насколько ты готов внимательно работать с размерами, качеством, измерениями и документацией?',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Совсем не готов')).toBeInTheDocument();
    expect(screen.getByText('Полностью готов')).toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Оценка готовности по шкале' })).toHaveValue('5');
  });
});
