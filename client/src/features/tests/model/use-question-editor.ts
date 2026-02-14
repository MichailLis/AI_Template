import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsControllerCreateQuestion,
  useTestsControllerDeleteQuestion,
  useTestsControllerUpdateQuestion,
} from '@/shared/api/generated/tests/tests';

import {
  buildQuestionFormFromQuestion,
  createEmptyQuestionFormState,
  createQuestionPayload,
  hasQuestionFormChanges,
  parseApiError,
} from '../lib/tests-utils';

import type { QuestionFormState, TestDraftQuestion } from './types';

interface UseQuestionEditorParams {
  topicId: number | null;
  onDataChanged: () => void;
}

export function useQuestionEditor({ topicId, onDataChanged }: UseQuestionEditorParams) {
  const createQuestionMutation = useTestsControllerCreateQuestion();
  const updateQuestionMutation = useTestsControllerUpdateQuestion();
  const deleteQuestionMutation = useTestsControllerDeleteQuestion();

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(
    createEmptyQuestionFormState(),
  );
  const [questionFormInitial, setQuestionFormInitial] = useState<QuestionFormState | null>(null);
  const [questionSubmitError, setQuestionSubmitError] = useState<string | null>(null);
  const [isDiscardQuestionConfirmOpen, setIsDiscardQuestionConfirmOpen] = useState(false);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<TestDraftQuestion | null>(
    null,
  );

  const isQuestionSubmitting = createQuestionMutation.isPending || updateQuestionMutation.isPending;

  const isQuestionDirty = useMemo(
    () => hasQuestionFormChanges(questionForm, questionFormInitial),
    [questionForm, questionFormInitial],
  );

  const closeQuestionModalDirect = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestionId(null);
    setQuestionForm(createEmptyQuestionFormState());
    setQuestionFormInitial(null);
    setQuestionSubmitError(null);
    setIsDiscardQuestionConfirmOpen(false);
  };

  const openCreateQuestionModal = () => {
    const initial = createEmptyQuestionFormState();
    setEditingQuestionId(null);
    setQuestionForm(initial);
    setQuestionFormInitial(initial);
    setQuestionSubmitError(null);
    setIsQuestionModalOpen(true);
  };

  const openEditQuestionModal = (question: TestDraftQuestion) => {
    const initial = buildQuestionFormFromQuestion(question);
    setEditingQuestionId(question.id);
    setQuestionForm(initial);
    setQuestionFormInitial(initial);
    setQuestionSubmitError(null);
    setIsQuestionModalOpen(true);
  };

  const handleQuestionModalRequestClose = () => {
    if (isQuestionDirty) {
      setIsDiscardQuestionConfirmOpen(true);
      return;
    }

    closeQuestionModalDirect();
  };

  const handleQuestionFormChange = (nextForm: QuestionFormState) => {
    setQuestionForm(nextForm);
    if (questionSubmitError) {
      setQuestionSubmitError(null);
    }
  };

  const handleSubmitQuestion = () => {
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

  const handleConfirmDeleteQuestion = () => {
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

  return {
    isQuestionModalOpen,
    editingQuestionId,
    questionForm,
    questionSubmitError,
    isQuestionSubmitting,
    isDiscardQuestionConfirmOpen,
    isDeletingQuestion: deleteQuestionMutation.isPending,
    pendingDeleteQuestion,
    openCreateQuestionModal,
    openEditQuestionModal,
    handleQuestionModalRequestClose,
    handleQuestionFormChange,
    handleSubmitQuestion,
    closeQuestionModalDirect,
    handleConfirmDeleteQuestion,
    setIsDiscardQuestionConfirmOpen,
    setPendingDeleteQuestion,
  };
}
