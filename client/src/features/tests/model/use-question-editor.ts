import { useMemo, useState } from 'react';

import {
  useTestsControllerCreateQuestion,
  useTestsControllerDeleteQuestion,
  useTestsControllerUpdateQuestion,
} from '@/shared/api/generated/tests/tests';

import {
  buildQuestionFormFromQuestion,
  createEmptyQuestionFormState,
  hasQuestionFormChanges,
} from '../lib/tests-utils';

import { confirmDeleteQuestion, submitQuestion } from './use-question-editor.helpers';

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
    submitQuestion({
      topicId,
      editingQuestionId,
      questionForm,
      createQuestionMutation,
      updateQuestionMutation,
      closeQuestionModalDirect,
      onDataChanged,
      setQuestionSubmitError,
    });
  };

  const handleConfirmDeleteQuestion = () => {
    confirmDeleteQuestion({
      topicId,
      editingQuestionId,
      pendingDeleteQuestion,
      deleteQuestionMutation,
      closeQuestionModalDirect,
      setPendingDeleteQuestion,
      onDataChanged,
    });
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
