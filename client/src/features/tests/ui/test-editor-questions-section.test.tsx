import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestEditorQuestionsSection } from './test-editor-questions-section';

import type { TestDraftQuestion } from '../model/types';

const question: TestDraftQuestion = {
  id: 1,
  order: 1,
  title: 'Первый вопрос',
  type: 'SINGLE_CHOICE',
  required: true,
  description: null,
  options: [],
  sliderBands: [],
  settings: null,
};

function LocationState() {
  const location = useLocation();
  return <output data-testid="state">{JSON.stringify(location.state)}</output>;
}

const renderAt = (state: unknown) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: '/admin/tests/5', state }]}>
      <Routes>
        <Route
          path="/admin/tests/:topicId"
          element={
            <>
              <TestEditorQuestionsSection
                questions={[question]}
                isReorderingQuestions={false}
                isDeletingQuestion={false}
                draggingQuestionId={null}
                dropTarget={null}
                onCreateQuestion={vi.fn()}
                onDragStart={vi.fn()}
                onDragOver={vi.fn()}
                onDragEnd={vi.fn()}
                onDrop={vi.fn()}
                onEditQuestion={vi.fn()}
                onRequestDeleteQuestion={vi.fn()}
              />
              <LocationState />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

/**
 * Задача ait-9os: окно создания закрывается вместе со списком тестов, и фокус падал на body.
 * Редактор нового теста ставит его на «Добавить вопрос».
 */
describe('TestEditorQuestionsSection focus after test creation', () => {
  afterEach(cleanup);

  it('focuses "Добавить вопрос" once and clears the flag', () => {
    renderAt({ focusAddQuestion: true });

    expect(screen.getByRole('button', { name: 'Добавить вопрос' })).toHaveFocus();
    expect(screen.getByTestId('state')).toHaveTextContent('null');
  });

  it('leaves focus alone on an ordinary visit', () => {
    renderAt(null);

    expect(screen.getByRole('button', { name: 'Добавить вопрос' })).not.toHaveFocus();
  });
});
