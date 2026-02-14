import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsControllerCreateQuestion,
  useTestsControllerCreateTopic,
  useTestsControllerDeleteQuestion,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerUpdateQuestion,
  useTestsControllerUpdateTopicDraft,
} from '@/shared/api/generated/tests/tests';

import { ConfirmActionDialog } from './tests/confirm-action-dialog';
import { QuestionModal } from './tests/question-modal';
import { TestEditor } from './tests/test-editor';
import { TestsSidebar } from './tests/tests-sidebar';
import {
  buildQuestionFormFromQuestion,
  createEmptyQuestionFormState,
  createQuestionPayload,
  hasDraftEdits,
  hasQuestionFormChanges,
  parseApiError,
} from './tests/utils';

import type { QuestionFormState, TestDraftQuestion } from './tests/types';

export default function AdminTestsPage() {
  const topicsQuery = useTestsControllerListTopics();
  const createTopicMutation = useTestsControllerCreateTopic();
  const updateDraftMutation = useTestsControllerUpdateTopicDraft();
  const createQuestionMutation = useTestsControllerCreateQuestion();
  const updateQuestionMutation = useTestsControllerUpdateQuestion();
  const deleteQuestionMutation = useTestsControllerDeleteQuestion();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();

  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [draftEdits, setDraftEdits] = useState<
    Record<number, { title: string; description: string }>
  >({});

  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestSlug, setNewTestSlug] = useState('');
  const [newTestDescription, setNewTestDescription] = useState('');
  const [testSearch, setTestSearch] = useState('');

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [questionForm, setQuestionForm] = useState<QuestionFormState>(
    createEmptyQuestionFormState(),
  );
  const [questionFormInitial, setQuestionFormInitial] = useState<QuestionFormState | null>(null);
  const [questionSubmitError, setQuestionSubmitError] = useState<string | null>(null);

  const [isDiscardQuestionConfirmOpen, setIsDiscardQuestionConfirmOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<TestDraftQuestion | null>(
    null,
  );

  const [pendingTopicSwitchId, setPendingTopicSwitchId] = useState<number | null>(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

  const [isAutoSavingDraft, setIsAutoSavingDraft] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);

  const effectiveSelectedTopicId = useMemo(() => {
    if (topics.length === 0) {
      return null;
    }

    if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topics[0].id;
  }, [selectedTopicId, topics]);

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId ?? 0, {
    query: {
      enabled: Boolean(effectiveSelectedTopicId),
    },
  });

  const detail = detailQuery.data;
  const draft = detail?.draft;
  const topicsErrorMessage = topicsQuery.isError ? parseApiError(topicsQuery.error) : null;
  const detailErrorMessage = detailQuery.isError ? parseApiError(detailQuery.error) : null;

  const draftForm = useMemo(() => {
    if (!draft) {
      return { id: 0, title: '', description: '' };
    }

    const edited = draftEdits[draft.id];
    return {
      id: draft.id,
      title: edited?.title ?? draft.title,
      description: edited?.description ?? draft.description ?? '',
    };
  }, [draft, draftEdits]);

  const isDraftDirty = draft ? hasDraftEdits(draft, draftForm.title, draftForm.description) : false;
  const canPublish = Boolean(detail && !isDraftDirty && detail.draft.questions.length > 0);

  const isQuestionSubmitting = createQuestionMutation.isPending || updateQuestionMutation.isPending;
  const isQuestionDirty = hasQuestionFormChanges(questionForm, questionFormInitial);

  const resetAutosaveMeta = () => {
    setLastAutoSavedAt(null);
    setAutoSaveError(null);
    setIsAutoSavingDraft(false);
  };

  const clearDraftEdits = useCallback((draftId: number) => {
    setDraftEdits((previous) => {
      const next = { ...previous };
      delete next[draftId];
      return next;
    });
  }, []);

  const updateCurrentDraftEdits = (patch: Partial<{ title: string; description: string }>) => {
    if (!draft) {
      return;
    }

    setDraftEdits((previous) => ({
      ...previous,
      [draft.id]: {
        title: patch.title ?? previous[draft.id]?.title ?? draft.title,
        description:
          patch.description ?? previous[draft.id]?.description ?? draft.description ?? '',
      },
    }));
  };

  const handleCreateTest = () => {
    if (!newTestTitle.trim()) {
      toast.error('Укажите название теста');
      return;
    }

    createTopicMutation.mutate(
      {
        data: {
          title: newTestTitle.trim(),
          slug: newTestSlug.trim() || undefined,
          description: newTestDescription.trim() || null,
        },
      },
      {
        onSuccess: (topic) => {
          toast.success('Тест создан');
          setNewTestTitle('');
          setNewTestSlug('');
          setNewTestDescription('');
          resetAutosaveMeta();
          setSelectedTopicId(topic.topicId);
          void topicsQuery.refetch();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSelectTest = (topicId: number) => {
    if (topicId === effectiveSelectedTopicId) {
      return;
    }

    if (isDraftDirty) {
      setPendingTopicSwitchId(topicId);
      setIsSwitchConfirmOpen(true);
      return;
    }

    resetAutosaveMeta();
    setSelectedTopicId(topicId);
  };

  const handleConfirmTopicSwitch = () => {
    if (pendingTopicSwitchId === null) {
      setIsSwitchConfirmOpen(false);
      return;
    }

    if (draft) {
      clearDraftEdits(draft.id);
    }

    resetAutosaveMeta();
    setSelectedTopicId(pendingTopicSwitchId);
    setPendingTopicSwitchId(null);
    setIsSwitchConfirmOpen(false);
  };

  const handleSaveDraft = useCallback(
    (mode: 'manual' | 'auto' = 'manual') => {
      if (!effectiveSelectedTopicId || !draft) {
        return;
      }

      if (mode === 'auto') {
        setIsAutoSavingDraft(true);
        setAutoSaveError(null);
      }

      updateDraftMutation.mutate(
        {
          topicId: effectiveSelectedTopicId,
          data: {
            title: draftForm.title.trim() || undefined,
            description: draftForm.description.trim() || null,
          },
        },
        {
          onSuccess: () => {
            if (mode === 'manual') {
              toast.success('Изменения сохранены');
            } else {
              setLastAutoSavedAt(
                new Date().toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              );
            }

            setIsAutoSavingDraft(false);
            setAutoSaveError(null);
            clearDraftEdits(draft.id);
            void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
          },
          onError: (error) => {
            const message = parseApiError(error);

            setIsAutoSavingDraft(false);
            if (mode === 'manual') {
              toast.error(message);
            } else {
              setAutoSaveError(message);
            }
          },
        },
      );
    },
    [
      clearDraftEdits,
      detailQuery,
      draft,
      draftForm.description,
      draftForm.title,
      effectiveSelectedTopicId,
      topicsQuery,
      updateDraftMutation,
    ],
  );

  useEffect(() => {
    if (!isDraftDirty || !draft || !effectiveSelectedTopicId) {
      return;
    }

    if (updateDraftMutation.isPending || publishMutation.isPending) {
      return;
    }

    const timer = window.setTimeout(() => {
      handleSaveDraft('auto');
    }, 1300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    handleSaveDraft,
    draft,
    effectiveSelectedTopicId,
    isDraftDirty,
    publishMutation.isPending,
    updateDraftMutation.isPending,
  ]);

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

  const closeQuestionModalDirect = () => {
    setIsQuestionModalOpen(false);
    setEditingQuestionId(null);
    setQuestionForm(createEmptyQuestionFormState());
    setQuestionFormInitial(null);
    setQuestionSubmitError(null);
    setIsDiscardQuestionConfirmOpen(false);
  };

  const handleQuestionModalRequestClose = () => {
    if (isQuestionDirty) {
      setIsDiscardQuestionConfirmOpen(true);
      return;
    }

    closeQuestionModalDirect();
  };

  const handleSubmitQuestion = () => {
    if (!effectiveSelectedTopicId) {
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
          topicId: effectiveSelectedTopicId,
          questionId: editingQuestionId,
          data: payload,
        },
        {
          onSuccess: () => {
            toast.success('Вопрос обновлен');
            closeQuestionModalDirect();
            void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
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
        topicId: effectiveSelectedTopicId,
        data: payload,
      },
      {
        onSuccess: () => {
          toast.success('Вопрос добавлен');
          closeQuestionModalDirect();
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
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
    if (!effectiveSelectedTopicId || !pendingDeleteQuestion) {
      setPendingDeleteQuestion(null);
      return;
    }

    deleteQuestionMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        questionId: pendingDeleteQuestion.id,
      },
      {
        onSuccess: () => {
          toast.success('Вопрос удален');
          if (editingQuestionId === pendingDeleteQuestion.id) {
            closeQuestionModalDirect();
          }
          setPendingDeleteQuestion(null);
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleConfirmPublish = () => {
    if (!effectiveSelectedTopicId) {
      setIsPublishConfirmOpen(false);
      return;
    }

    publishMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создана новая версия в работе v${result.newDraftVersionNumber}`,
          );
          setIsPublishConfirmOpen(false);
          closeQuestionModalDirect();
          if (draft) {
            clearDraftEdits(draft.id);
          }
          resetAutosaveMeta();
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleReorderQuestions = (questionIds: number[]) => {
    if (!effectiveSelectedTopicId || !detail || reorderQuestionsMutation.isPending) {
      return;
    }

    const currentIds = detail.draft.questions.map((question) => question.id);
    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    const currentIdSet = new Set(currentIds);
    const nextIdSet = new Set(questionIds);
    const hasInvalidPayload =
      nextIdSet.size !== questionIds.length ||
      questionIds.length !== currentIds.length ||
      questionIds.some((id) => !currentIdSet.has(id));

    if (hasInvalidPayload) {
      toast.error('Не удалось изменить порядок: список вопросов устарел. Обновите страницу теста.');
      void detailQuery.refetch();
      return;
    }

    reorderQuestionsMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        data: {
          questionIds,
        },
      },
      {
        onSuccess: () => {
          toast.success('Порядок вопросов обновлен');
          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
        onError: (error) => {
          const message = parseApiError(error);
          const normalizedMessage = message.toLowerCase();

          if (
            normalizedMessage.includes('numeric string is expected') ||
            normalizedMessage.includes('questionid') ||
            normalizedMessage.includes('validation failed')
          ) {
            toast.error(
              'Ошибка маршрута reorder на backend. Перезапустите сервер и обновите страницу.',
            );
          } else {
            toast.error(`Не удалось изменить порядок: ${message}`);
          }

          void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
        },
      },
    );
  };

  const autosaveHint = isAutoSavingDraft
    ? 'Автосохранение...'
    : lastAutoSavedAt
      ? `Автосохранено в ${lastAutoSavedAt}`
      : null;

  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <TestsSidebar
          topics={topics}
          selectedTopicId={effectiveSelectedTopicId}
          topicsLoading={topicsQuery.isLoading}
          topicsError={topicsQuery.isError}
          topicsErrorMessage={topicsErrorMessage}
          searchValue={testSearch}
          onSearchChange={setTestSearch}
          newTestTitle={newTestTitle}
          newTestSlug={newTestSlug}
          newTestDescription={newTestDescription}
          isCreating={createTopicMutation.isPending}
          onNewTestTitleChange={setNewTestTitle}
          onNewTestSlugChange={setNewTestSlug}
          onNewTestDescriptionChange={setNewTestDescription}
          onCreateTest={handleCreateTest}
          onSelectTest={handleSelectTest}
          onRetryTopics={() => {
            void topicsQuery.refetch();
          }}
        />

        <TestEditor
          hasSelection={Boolean(effectiveSelectedTopicId)}
          loading={detailQuery.isLoading}
          error={detailQuery.isError}
          errorMessage={detailErrorMessage}
          detail={detail}
          draftTitle={draftForm.title}
          draftDescription={draftForm.description}
          draftDirty={isDraftDirty}
          canPublish={canPublish}
          isSavingDraft={updateDraftMutation.isPending}
          isPublishing={publishMutation.isPending}
          isReorderingQuestions={reorderQuestionsMutation.isPending}
          isDeletingQuestion={deleteQuestionMutation.isPending}
          autosaveHint={autosaveHint}
          autosaveError={autoSaveError}
          onDraftTitleChange={(value) => updateCurrentDraftEdits({ title: value })}
          onDraftDescriptionChange={(value) => updateCurrentDraftEdits({ description: value })}
          onSaveDraft={() => handleSaveDraft('manual')}
          onRequestPublish={() => setIsPublishConfirmOpen(true)}
          onCreateQuestion={openCreateQuestionModal}
          onEditQuestion={openEditQuestionModal}
          onRequestDeleteQuestion={setPendingDeleteQuestion}
          onReorderQuestions={handleReorderQuestions}
          onRetryLoad={() => {
            void detailQuery.refetch();
          }}
        />
      </div>

      <QuestionModal
        open={isQuestionModalOpen}
        mode={editingQuestionId ? 'edit' : 'create'}
        form={questionForm}
        submitError={questionSubmitError}
        isSubmitting={isQuestionSubmitting}
        onSubmit={handleSubmitQuestion}
        onRequestClose={handleQuestionModalRequestClose}
        onFormChange={(nextForm) => {
          setQuestionForm(nextForm);
          if (questionSubmitError) {
            setQuestionSubmitError(null);
          }
        }}
      />

      <ConfirmActionDialog
        open={isSwitchConfirmOpen}
        title="Переключить тест без сохранения?"
        description="У текущего теста есть несохраненные изменения. Они будут потеряны при переключении."
        confirmLabel="Переключить без сохранения"
        variant="destructive"
        onConfirm={handleConfirmTopicSwitch}
        onClose={() => {
          setIsSwitchConfirmOpen(false);
          setPendingTopicSwitchId(null);
        }}
      />

      <ConfirmActionDialog
        open={isDiscardQuestionConfirmOpen}
        title="Закрыть редактор вопроса?"
        description="Есть несохраненные изменения в вопросе. Они будут потеряны."
        confirmLabel="Закрыть без сохранения"
        variant="destructive"
        onConfirm={closeQuestionModalDirect}
        onClose={() => setIsDiscardQuestionConfirmOpen(false)}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDeleteQuestion)}
        title="Удалить вопрос?"
        description={
          pendingDeleteQuestion
            ? `Вопрос "${pendingDeleteQuestion.title}" будет удален из версии в работе.`
            : 'Вопрос будет удален из версии в работе.'
        }
        confirmLabel="Удалить вопрос"
        variant="destructive"
        isConfirming={deleteQuestionMutation.isPending}
        onConfirm={handleConfirmDeleteQuestion}
        onClose={() => setPendingDeleteQuestion(null)}
      />

      <ConfirmActionDialog
        open={isPublishConfirmOpen}
        title="Опубликовать текущую версию теста?"
        description="Текущая версия в работе станет опубликованной. После публикации будет создана новая версия в работе для дальнейших изменений."
        confirmLabel="Опубликовать"
        isConfirming={publishMutation.isPending}
        onConfirm={handleConfirmPublish}
        onClose={() => setIsPublishConfirmOpen(false)}
      />
    </>
  );
}
