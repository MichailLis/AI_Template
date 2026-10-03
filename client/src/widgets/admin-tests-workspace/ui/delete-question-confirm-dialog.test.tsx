import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DeleteQuestionConfirmDialog } from './delete-question-confirm-dialog';

/** Список вопросов с подтверждением удаления — как в редакторе теста. */
function Harness({
  initialIds,
  removeBeforeClose = false,
}: {
  initialIds: number[];
  removeBeforeClose?: boolean;
}) {
  const [ids, setIds] = useState(initialIds);
  const [pending, setPending] = useState<{ id: number } | null>(null);

  return (
    <>
      {ids.map((id) => (
        <div key={id}>
          <button type="button" data-question-edit={id}>
            {`Изменить ${id}`}
          </button>
          <button type="button" onClick={() => setPending({ id })}>
            {`Удалить ${id}`}
          </button>
        </div>
      ))}
      <button type="button" data-question-add="">
        Добавить вопрос
      </button>
      <DeleteQuestionConfirmDialog
        pendingQuestion={pending}
        description="Вопрос будет удален."
        isDeleting={false}
        onConfirm={() => {
          const remove = () => setIds((current) => current.filter((id) => id !== pending?.id));
          // В редакторе бывает и так и так: список перечитывается до или после закрытия окна.
          if (removeBeforeClose) {
            remove();
            setPending(null);
          } else {
            setPending(null);
            setTimeout(remove, 0);
          }
        }}
        onClose={() => setPending(null)}
      />
    </>
  );
}

const deleteQuestion = async (id: number) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: `Удалить ${id}` }));
  await user.click(await screen.findByRole('button', { name: 'Удалить вопрос' }));
};

/** Задача ait-9os: строки удаленного вопроса нет, и фокус падал на body. */
describe('DeleteQuestionConfirmDialog focus', () => {
  afterEach(cleanup);

  it('moves focus to the next question', async () => {
    render(<Harness initialIds={[1, 2, 3]} />);
    await deleteQuestion(2);

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Изменить 3' })).toHaveFocus(),
    );
  });

  it('moves focus to the previous question when the last one is deleted', async () => {
    render(<Harness initialIds={[1, 2]} />);
    await deleteQuestion(2);

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Изменить 1' })).toHaveFocus(),
    );
  });

  it('moves focus to "Добавить вопрос" when no questions are left', async () => {
    render(<Harness initialIds={[1]} />);
    await deleteQuestion(1);

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Добавить вопрос' })).toHaveFocus(),
    );
  });

  it('returns focus to the delete button after cancelling', async () => {
    const user = userEvent.setup();
    render(<Harness initialIds={[1, 2]} />);
    const deleteButton = screen.getByRole('button', { name: 'Удалить 2' });
    await user.click(deleteButton);
    await user.click(await screen.findByRole('button', { name: 'Отмена' }));

    await vi.waitFor(() => expect(deleteButton).toHaveFocus());
  });

  it('finds the next question even when the deleted row is already gone', async () => {
    render(<Harness initialIds={[1, 2, 3]} removeBeforeClose />);
    await deleteQuestion(2);

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Изменить 3' })).toHaveFocus(),
    );
  });
});
