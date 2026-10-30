import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestQuestionsOnlyView } from './test-questions-only-view';

/**
 * Находка аудита UX-11: ссылка «Настройки» в редакторе вела в настройки теста, но называлась так же,
 * как пункт меню «Настройки» с глобальными ключами и интеграциями.
 */
describe('TestQuestionsOnlyView header', () => {
  afterEach(cleanup);

  it('names the link to the test settings so it is not confused with global settings', () => {
    render(
      <MemoryRouter>
        <TestQuestionsOnlyView
          loading
          error={false}
          detail={undefined}
          isReorderingQuestions={false}
          isDeletingQuestion={false}
          topicId={8}
          onRetryLoad={vi.fn()}
          onCreateQuestion={vi.fn()}
          onEditQuestion={vi.fn()}
          onRequestDeleteQuestion={vi.fn()}
          onReorderQuestions={vi.fn()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Настройки теста' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Настройки' })).not.toBeInTheDocument();
  });
});
