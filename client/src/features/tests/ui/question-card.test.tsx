import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuestionCard } from './question-card';

import type { TestDraftQuestion } from '../model/types';

const createQuestion = (id: number, order: number, title: string): TestDraftQuestion => ({
  id,
  order,
  title,
  type: 'SINGLE_CHOICE',
  required: true,
  description: null,
  options: [],
  sliderBands: [],
  settings: null,
});

describe('QuestionCard move actions (UX-19)', () => {
  afterEach(cleanup);

  it('disables move up for the first question and enables move down', () => {
    render(
      <QuestionCard
        question={createQuestion(1, 1, 'Первый вопрос')}
        isFirst
        isLast={false}
        isReorderingQuestions={false}
        isDeletingQuestion={false}
        isDragging={false}
        isDropTarget={false}
        isAnyDragging={false}
        dropPosition={null}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
        onDragEnd={vi.fn()}
        onEditQuestion={vi.fn()}
        onRequestDeleteQuestion={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );

    const upButton = screen.getByRole('button', { name: 'Переместить вопрос 1 вверх' });
    const downButton = screen.getByRole('button', { name: 'Переместить вопрос 1 вниз' });

    expect(upButton).toBeDisabled();
    expect(downButton).toBeEnabled();
  });

  it('disables move down for the last question and enables move up', () => {
    render(
      <QuestionCard
        question={createQuestion(2, 2, 'Второй вопрос')}
        isFirst={false}
        isLast
        isReorderingQuestions={false}
        isDeletingQuestion={false}
        isDragging={false}
        isDropTarget={false}
        isAnyDragging={false}
        dropPosition={null}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
        onDragEnd={vi.fn()}
        onEditQuestion={vi.fn()}
        onRequestDeleteQuestion={vi.fn()}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
      />,
    );

    const upButton = screen.getByRole('button', { name: 'Переместить вопрос 2 вверх' });
    const downButton = screen.getByRole('button', { name: 'Переместить вопрос 2 вниз' });

    expect(upButton).toBeEnabled();
    expect(downButton).toBeDisabled();
  });

  it('calls onMoveUp and onMoveDown when clicked', async () => {
    const user = userEvent.setup();
    const onMoveUp = vi.fn();
    const onMoveDown = vi.fn();

    render(
      <QuestionCard
        question={createQuestion(3, 2, 'Средний вопрос')}
        isFirst={false}
        isLast={false}
        isReorderingQuestions={false}
        isDeletingQuestion={false}
        isDragging={false}
        isDropTarget={false}
        isAnyDragging={false}
        dropPosition={null}
        onDragStart={vi.fn()}
        onDragOver={vi.fn()}
        onDrop={vi.fn()}
        onDragEnd={vi.fn()}
        onEditQuestion={vi.fn()}
        onRequestDeleteQuestion={vi.fn()}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      />,
    );

    const upButton = screen.getByRole('button', { name: 'Переместить вопрос 2 вверх' });
    const downButton = screen.getByRole('button', { name: 'Переместить вопрос 2 вниз' });

    await user.click(upButton);
    expect(onMoveUp).toHaveBeenCalledWith(3);

    await user.click(downButton);
    expect(onMoveDown).toHaveBeenCalledWith(3);
  });
});
