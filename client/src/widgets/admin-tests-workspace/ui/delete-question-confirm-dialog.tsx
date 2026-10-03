import { useRef } from 'react';

import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

const getEditButtons = () => [...document.querySelectorAll<HTMLElement>('[data-question-edit]')];

/** Место вопроса в списке на момент подтверждения: к закрытию окна его строки может уже не быть. */
const getQuestionIndex = (questionId: number) =>
  getEditButtons().findIndex((button) => button.dataset.questionEdit === String(questionId));

/**
 * Строки удаленного вопроса уже нет, и фокус падал на body. Ставим его на «Изменить» вопроса,
 * вставшего на это место, у последнего — предыдущего, а если вопросов не осталось — на
 * «Добавить вопрос».
 */
const focusQuestionAfterDelete = (deleted: { id: number; index: number }) => {
  const remaining = getEditButtons().filter(
    (button) => button.dataset.questionEdit !== String(deleted.id),
  );
  const index = Math.max(deleted.index, 0);
  const target =
    remaining[index] ??
    remaining[remaining.length - 1] ??
    document.querySelector<HTMLElement>('[data-question-add]');

  if (!target) {
    return false;
  }
  target.focus();
  return true;
};

interface DeleteQuestionConfirmDialogProps {
  pendingQuestion: { id: number } | null;
  description: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteQuestionConfirmDialog({
  pendingQuestion,
  description,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteQuestionConfirmDialogProps) {
  // Вопрос, удаление которого подтвердили, и его место в списке: по ним ищется соседний вопрос.
  const confirmedQuestion = useRef<{ id: number; index: number } | null>(null);

  return (
    <ConfirmActionDialog
      open={Boolean(pendingQuestion)}
      title="Удалить вопрос?"
      description={description}
      confirmLabel="Удалить вопрос"
      variant="destructive"
      isConfirming={isDeleting}
      onConfirm={() => {
        confirmedQuestion.current = pendingQuestion
          ? { id: pendingQuestion.id, index: getQuestionIndex(pendingQuestion.id) }
          : null;
        onConfirm();
      }}
      onClose={onClose}
      onCloseAutoFocus={(event) => {
        const deletedQuestion = confirmedQuestion.current;
        confirmedQuestion.current = null;
        // После «Отмена» строка на месте, и фокус возвращается на ее «Удалить».
        if (deletedQuestion && focusQuestionAfterDelete(deletedQuestion)) {
          event.preventDefault();
        }
      }}
    />
  );
}
