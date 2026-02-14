import { useCallback, useMemo, useState } from 'react';

import {
  AiTestGeneratorModal,
  QuestionModal,
  TestEditor,
  TestsSidebar,
  hasDraftEdits,
  parseApiError,
  useDraftAutosave,
  useQuestionEditor,
  type TestTopicListItem,
} from '@/features/tests';
import {
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
} from '@/shared/api/generated/tests/tests';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';
import { PublicLinksHandoffCard } from './public-links-handoff-card';
import { useAdminTestsWorkspaceActions } from './use-admin-tests-workspace-actions';

export function AdminTestsWorkspace() {
  const topicsQuery = useTestsControllerListTopics();
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
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
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingDeleteTopic, setPendingDeleteTopic] = useState<TestTopicListItem | null>(null);

  const [pendingTopicSwitchId, setPendingTopicSwitchId] = useState<number | null>(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

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

  const clearDraftEdits = useCallback((draftId: number) => {
    setDraftEdits((previous) => {
      const next = { ...previous };
      delete next[draftId];
      return next;
    });
  }, []);

  const isDraftDirty = draft ? hasDraftEdits(draft, draftForm.title, draftForm.description) : false;
  const canPublish = Boolean(detail && !isDraftDirty && detail.draft.questions.length > 0);

  const refetchTestsData = useCallback(() => {
    void Promise.all([topicsQuery.refetch(), detailQuery.refetch()]);
  }, [detailQuery, topicsQuery]);

  const draftAutosave = useDraftAutosave({
    topicId: effectiveSelectedTopicId,
    draft,
    draftForm,
    isDraftDirty,
    publishIsPending: publishMutation.isPending,
    clearDraftEdits,
    onAfterSave: refetchTestsData,
  });

  const questionEditor = useQuestionEditor({
    topicId: effectiveSelectedTopicId,
    onDataChanged: refetchTestsData,
  });

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

  const {
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    autosaveHint,
  } = useAdminTestsWorkspaceActions({
    newTestTitle,
    newTestSlug,
    newTestDescription,
    setNewTestTitle,
    setNewTestSlug,
    setNewTestDescription,
    setIsAiGeneratorOpen,
    createTopicMutation,
    createTopicFromAiMutation,
    deleteTopicMutation,
    reorderQuestionsMutation,
    publishMutation,
    draftAutosave,
    setSelectedTopicId,
    refetchTopicsOnly: () => {
      void topicsQuery.refetch();
    },
    refetchTestsData,
    effectiveSelectedTopicId,
    isDraftDirty,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    pendingTopicSwitchId,
    draft,
    clearDraftEdits,
    pendingDeleteTopic,
    setPendingDeleteTopic,
    topics,
    questionEditor,
    setIsPublishConfirmOpen,
    detail,
    refetchDetailOnly: () => {
      void detailQuery.refetch();
    },
  });

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
          isCreatingWithAi={createTopicFromAiMutation.isPending}
          isDeletingTopic={deleteTopicMutation.isPending}
          deletingTopicId={pendingDeleteTopic?.id ?? null}
          onNewTestTitleChange={setNewTestTitle}
          onNewTestSlugChange={setNewTestSlug}
          onNewTestDescriptionChange={setNewTestDescription}
          onCreateTest={handleCreateTest}
          onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
          onRequestDeleteTest={setPendingDeleteTopic}
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
          isSavingDraft={draftAutosave.isSavingDraft}
          isPublishing={publishMutation.isPending}
          isReorderingQuestions={reorderQuestionsMutation.isPending}
          isDeletingQuestion={questionEditor.isDeletingQuestion}
          autosaveHint={autosaveHint}
          autosaveError={draftAutosave.autoSaveError}
          onDraftTitleChange={(value) => updateCurrentDraftEdits({ title: value })}
          onDraftDescriptionChange={(value) => updateCurrentDraftEdits({ description: value })}
          onSaveDraft={() => draftAutosave.saveDraft('manual')}
          onRequestPublish={() => setIsPublishConfirmOpen(true)}
          onCreateQuestion={questionEditor.openCreateQuestionModal}
          onEditQuestion={questionEditor.openEditQuestionModal}
          onRequestDeleteQuestion={questionEditor.setPendingDeleteQuestion}
          onReorderQuestions={handleReorderQuestions}
          onRetryLoad={() => {
            void detailQuery.refetch();
          }}
        />
      </div>

      <PublicLinksHandoffCard />

      <AiTestGeneratorModal
        open={isAiGeneratorOpen}
        isCreating={createTopicFromAiMutation.isPending}
        onOpenChange={setIsAiGeneratorOpen}
        onCreate={handleCreateTestFromAi}
      />

      <QuestionModal
        open={questionEditor.isQuestionModalOpen}
        mode={questionEditor.editingQuestionId ? 'edit' : 'create'}
        form={questionEditor.questionForm}
        submitError={questionEditor.questionSubmitError}
        isSubmitting={questionEditor.isQuestionSubmitting}
        onSubmit={questionEditor.handleSubmitQuestion}
        onRequestClose={questionEditor.handleQuestionModalRequestClose}
        onFormChange={questionEditor.handleQuestionFormChange}
      />

      <AdminTestsConfirmDialogs
        isSwitchConfirmOpen={isSwitchConfirmOpen}
        onConfirmTopicSwitch={handleConfirmTopicSwitch}
        onCloseTopicSwitch={() => {
          setIsSwitchConfirmOpen(false);
          setPendingTopicSwitchId(null);
        }}
        isDiscardQuestionConfirmOpen={questionEditor.isDiscardQuestionConfirmOpen}
        onConfirmDiscardQuestion={questionEditor.closeQuestionModalDirect}
        onCloseDiscardQuestion={() => questionEditor.setIsDiscardQuestionConfirmOpen(false)}
        pendingDeleteTopic={pendingDeleteTopic}
        isDeletingTopic={deleteTopicMutation.isPending}
        onConfirmDeleteTopic={handleConfirmDeleteTopic}
        onCloseDeleteTopic={() => setPendingDeleteTopic(null)}
        pendingDeleteQuestion={questionEditor.pendingDeleteQuestion}
        isDeletingQuestion={questionEditor.isDeletingQuestion}
        onConfirmDeleteQuestion={questionEditor.handleConfirmDeleteQuestion}
        onCloseDeleteQuestion={() => questionEditor.setPendingDeleteQuestion(null)}
        isPublishConfirmOpen={isPublishConfirmOpen}
        isPublishing={publishMutation.isPending}
        onConfirmPublish={handleConfirmPublish}
        onClosePublish={() => setIsPublishConfirmOpen(false)}
      />
    </>
  );
}
