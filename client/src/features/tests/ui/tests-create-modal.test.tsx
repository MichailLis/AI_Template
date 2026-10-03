import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { TestsCreateModal } from './tests-create-modal';

const renderModal = (title: string, onCreateTest = vi.fn()) =>
  render(
    <TestsCreateModal
      open
      isCreating={false}
      newTestTitle={title}
      newTestSlug=""
      newTestDescription=""
      onOpenChange={vi.fn()}
      onNewTestTitleChange={vi.fn()}
      onNewTestSlugChange={vi.fn()}
      onNewTestDescriptionChange={vi.fn()}
      onCreateTest={onCreateTest}
    />,
  );

/** Находка аудита D13: кнопка молча отключалась; теперь она активна, а причина стоит у поля. */
describe('TestsCreateModal', () => {
  afterEach(cleanup);

  it('keeps the submit button enabled and explains the empty title at the field', async () => {
    const onCreateTest = vi.fn();
    renderModal('', onCreateTest);

    const submit = screen.getByRole('button', { name: 'Создать тест' });
    expect(submit).toBeEnabled();

    await userEvent.click(submit);

    const input = screen.getByLabelText('Название теста *');
    expect(onCreateTest).not.toHaveBeenCalled();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Укажите название теста');
    expect(input).toHaveFocus();
  });

  it('submits when the title is filled', async () => {
    const onCreateTest = vi.fn();
    renderModal('Новый тест', onCreateTest);

    await userEvent.click(screen.getByRole('button', { name: 'Создать тест' }));

    expect(onCreateTest).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Название теста *')).not.toHaveAttribute('aria-invalid');
  });
});
