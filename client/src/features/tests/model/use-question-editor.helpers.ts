import { toast } from 'sonner';

import { createQuestionPayload, parseApiError } from '../lib/tests-utils';

import type { QuestionFormState, TestDraftQuestion } from './types';
import type { UpsertTestsQuestionDto } from '@/shared/api/model';

type CreateQuestionMutate = (
  variables: { topicId: number; data: UpsertTestsQuestionDto },
  options: {
    onSuccess: () => void;
    onError: (error: unknown) => void;
  },
) => void;

type UpdateQuestionMutate = (
  variables: { topicId: number; questionId: number; data: UpsertTestsQuestionDto },
  options: {
    onSuccess: () => void;
    onError: (error: unknown) => void;
  },
) => void;

type DeleteQuestionMutate = (
  variables: { topicId: number; questionId: number },
  options: {
    onSuccess: () => void;
    onError: (error: unknown) => void;
  },
) => void;

interface SubmitQuestionParams {
  topicId: number | null;
  editingQuestionId: number | null;
  questionForm: QuestionFormState;
  createQuestionMutation: { mutate: CreateQuestionMutate };
  updateQuestionMutation: { mutate: UpdateQuestionMutate };
  closeQuestionModalDirect: () => void;
  onDataChanged: () => void;
  setQuestionSubmitError: (error: string | null) => void;
}

interface ConfirmDeleteQuestionParams {
  topicId: number | null;
  editingQuestionId: number | null;
  pendingDeleteQuestion: TestDraftQuestion | null;
  deleteQuestionMutation: { mutate: DeleteQuestionMutate };
  closeQuestionModalDirect: () => void;
  setPendingDeleteQuestion: (question: TestDraftQuestion | null) => void;
  onDataChanged: () => void;
}

export const submitQuestion = ({
  topicId,
  editingQuestionId,
  questionForm,
  createQuestionMutation,
  updateQuestionMutation,
  closeQuestionModalDirect,
  onDataChanged,
  setQuestionSubmitError,
}: SubmitQuestionParams) => {
  if (!topicId) {
    return;
  }

  let payload: ReturnType<typeof createQuestionPayload>;
  try {
    payload = createQuestionPayload(questionForm);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Некорректные данные вопроса';
    setQuestionSubmitError(message);
    return;
  }

  setQuestionSubmitError(null);

  if (editingQuestionId) {
    updateQuestionMutation.mutate(
      {
        topicId,
        questionId: editingQuestionId,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success('Вопрос обновлен');
          closeQuestionModalDirect();
          onDataChanged();
        },
        onError: (error) => {
          const message = parseApiError(error);
          setQuestionSubmitError(message);
          toast.error(message);
        },
      },
    );

    return;
  }

  createQuestionMutation.mutate(
    {
      topicId,
      data: payload,
    },
    {
      onSuccess: () => {
        toast.success('Вопрос добавлен');
        closeQuestionModalDirect();
        onDataChanged();
      },
      onError: (error) => {
        const message = parseApiError(error);
        setQuestionSubmitError(message);
        toast.error(message);
      },
    },
  );
};

export const confirmDeleteQuestion = ({
  topicId,
  editingQuestionId,
  pendingDeleteQuestion,
  deleteQuestionMutation,
  closeQuestionModalDirect,
  setPendingDeleteQuestion,
  onDataChanged,
}: ConfirmDeleteQuestionParams) => {
  if (!topicId || !pendingDeleteQuestion) {
    setPendingDeleteQuestion(null);
    return;
  }

  deleteQuestionMutation.mutate(
    {
      topicId,
      questionId: pendingDeleteQuestion.id,
    },
    {
      onSuccess: () => {
        toast.success('Вопрос удален');
        if (editingQuestionId === pendingDeleteQuestion.id) {
          closeQuestionModalDirect();
        }
        setPendingDeleteQuestion(null);
        onDataChanged();
      },
      onError: (error) => {
        toast.error(parseApiError(error));
      },
    },
  );
};
