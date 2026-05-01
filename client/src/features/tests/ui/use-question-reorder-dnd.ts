import { type DragEvent, useState } from 'react';

import type { TestDraftQuestion } from '../model/types';

export type DropPosition = 'before' | 'after';

export interface QuestionDropTarget {
  questionId: number;
  position: DropPosition;
}

const buildReorderedQuestionIds = (
  orderedQuestions: TestDraftQuestion[],
  draggingQuestionId: number,
  targetQuestionId: number,
  dropPosition: DropPosition,
) => {
  const sourceIndex = orderedQuestions.findIndex((question) => question.id === draggingQuestionId);
  const targetIndex = orderedQuestions.findIndex((question) => question.id === targetQuestionId);

  if (sourceIndex < 0 || targetIndex < 0) {
    return null;
  }

  let insertIndex = targetIndex + (dropPosition === 'after' ? 1 : 0);
  if (sourceIndex < insertIndex) {
    insertIndex -= 1;
  }

  if (insertIndex === sourceIndex) {
    return null;
  }

  const reorderedQuestions = [...orderedQuestions];
  const [movedQuestion] = reorderedQuestions.splice(sourceIndex, 1);
  reorderedQuestions.splice(insertIndex, 0, movedQuestion);

  return reorderedQuestions.map((question) => question.id);
};

export function useQuestionReorderDnd({
  questions,
  onReorderQuestions,
}: {
  questions: TestDraftQuestion[] | undefined;
  onReorderQuestions: (questionIds: number[]) => void;
}) {
  const [draggingQuestionId, setDraggingQuestionId] = useState<number | null>(null);
  const [dropTarget, setDropTarget] = useState<QuestionDropTarget | null>(null);

  const resetDragState = () => {
    setDraggingQuestionId(null);
    setDropTarget(null);
  };

  const handleDragStart = (questionId: number) => {
    setDraggingQuestionId(questionId);
  };

  const handleDragOver = (questionId: number, event: DragEvent<HTMLDivElement>) => {
    if (draggingQuestionId === null || draggingQuestionId === questionId) {
      setDropTarget(null);
      return;
    }

    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerOffset = event.clientY - bounds.top;
    const position: DropPosition = pointerOffset < bounds.height / 2 ? 'before' : 'after';

    setDropTarget((previous) => {
      if (previous?.questionId === questionId && previous.position === position) {
        return previous;
      }

      return { questionId, position };
    });
  };

  const handleDrop = (targetQuestionId: number) => {
    if (!questions || draggingQuestionId === null || draggingQuestionId === targetQuestionId) {
      resetDragState();
      return;
    }

    const dropPosition: DropPosition =
      dropTarget?.questionId === targetQuestionId ? dropTarget.position : 'after';
    const reorderedQuestionIds = buildReorderedQuestionIds(
      questions,
      draggingQuestionId,
      targetQuestionId,
      dropPosition,
    );

    if (!reorderedQuestionIds) {
      resetDragState();
      return;
    }

    onReorderQuestions(reorderedQuestionIds);
    resetDragState();
  };

  return {
    draggingQuestionId,
    dropTarget,
    handleDragStart,
    handleDragOver,
    handleDragEnd: resetDragState,
    handleDrop,
  };
}
