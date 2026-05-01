import { useEffect, useState } from 'react';

import {
  AiTestGeneratorModal,
  QuestionModal,
  TestQuestionsOnlyView,
  TestsCreateModal,
} from '@/features/tests';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';
import { AdminTestsListSection } from './admin-tests-list-section';
import { AdminTestsSettingsCard } from './admin-tests-settings-card';
import { useAdminTestsWorkspace } from './use-admin-tests-workspace';
import { useAdminTestsWorkspaceNavigation } from './use-admin-tests-workspace-navigation';

export function AdminTestsWorkspace() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const {
    topics,
    topicsQuery,
    topicsErrorMessage,
    detail,
    detailQuery,
    detailErrorMessage,
    draftForm,
    isDraftDirty,
    canPublish,
    draftAutosave,
    questionEditor,
    autosaveHint,
    effectiveSelectedTopicId,
    listMode,
    newTestTitle,
    newTestSlug,
    newTestDescription,
    testSearch,
    isAiGeneratorOpen,
    isPublishConfirmOpen,
    pendingDeleteTopic,
    isSwitchConfirmOpen,
    isNavigationConfirmOpen,
    pendingNavigationPath,
    createTopicMutation,
    createTopicFromAiMutation,
    deleteTopicMutation,
    reorderQuestionsMutation,
    publishMutation,
    setTestSearch,
    setNewTestTitle,
    setNewTestSlug,
    setNewTestDescription,
    setIsAiGeneratorOpen,
    setPendingDeleteTopic,
    setPendingTopicSwitchId,
    setPendingArchiveTopic,
    setPendingRestoreTopic,
    setListMode,
    setIsSwitchConfirmOpen,
    setIsPublishConfirmOpen,
    setIsNavigationConfirmOpen,
    setPendingNavigationPath,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation,
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
    handleToggleTopicActive,
    pendingArchiveTopic,
    pendingRestoreTopic,
    isSelectedTopicArchived,
    archiveTopicMutation,
    restoreTopicMutation,
  } = useAdminTestsWorkspace();

  const {
    isListRoute,
    isSettingsRoute,
    handleNavigationLeave,
    handleNavigationStay,
    handleWorkspaceNavigate,
  } = useAdminTestsWorkspaceNavigation({
    effectiveSelectedTopicId,
    isDraftDirty,
    pendingNavigationPath,
    discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation,
    setIsNavigationConfirmOpen,
    setPendingNavigationPath,
  });

  useEffect(() => {
    if (isListRoute || !isCreateModalOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsCreateModalOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCreateModalOpen, isListRoute]);

  // Wrapper handlers for switch confirm dialog
  const handleConfirmStay = () => {
    setIsSwitchConfirmOpen(false);
    setPendingTopicSwitchId(null);
  };

  const handleConfirmLeave = () => {
    setIsSwitchConfirmOpen(false);
    setPendingTopicSwitchId(null);
    handleConfirmTopicSwitch();
  };

  return (
    <>
      <div className="grid gap-4">
        {(() => {
          if (isListRoute) {
            return (
              <AdminTestsListSection
                topics={topics}
                listMode={listMode}
                topicsLoading={topicsQuery.isLoading}
                topicsError={topicsQuery.isError}
                topicsErrorMessage={topicsErrorMessage}
                searchValue={testSearch}
                isArchivingTopic={archiveTopicMutation.isPending}
                archivingTopicId={pendingArchiveTopic?.id ?? null}
                isRestoringTopic={restoreTopicMutation.isPending}
                restoringTopicId={pendingRestoreTopic?.id ?? null}
                isDeletingTopic={deleteTopicMutation.isPending}
                deletingTopicId={pendingDeleteTopic?.id ?? null}
                onSearchChange={setTestSearch}
                onListModeChange={setListMode}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                onOpenAiGenerator={() => setIsAiGeneratorOpen(true)}
                onSelectTest={handleSelectTest}
                onOpenSettings={(topicId) =>
                  handleWorkspaceNavigate(`/admin/tests/${topicId}/settings`)
                }
                onRequestArchiveTest={setPendingArchiveTopic}
                onRequestRestoreTest={setPendingRestoreTopic}
                onRequestDeleteTest={setPendingDeleteTopic}
                onRetryTopics={() => {
                  void topicsQuery.refetch();
                }}
              />
            );
          }

          if (isSettingsRoute && effectiveSelectedTopicId !== null) {
            return (
              <AdminTestsSettingsCard
                published={detail?.published ?? null}
                draftForm={draftForm}
                isDraftDirty={isDraftDirty}
                isSelectedTopicArchived={isSelectedTopicArchived}
                canPublish={canPublish}
                isSavingDraft={draftAutosave.isSavingDraft}
                autoSaveError={draftAutosave.autoSaveError}
                autosaveHint={autosaveHint}
                isPublishing={publishMutation.isPending}
                isArchivingTopic={archiveTopicMutation.isPending}
                isRestoringTopic={restoreTopicMutation.isPending}
                onBackToQuestions={() =>
                  handleWorkspaceNavigate(`/admin/tests/${effectiveSelectedTopicId}`)
                }
                onDraftTitleChange={(value) => updateCurrentDraftEdits({ title: value })}
                onDraftDescriptionChange={(value) =>
                  updateCurrentDraftEdits({ description: value })
                }
                onSaveDraft={() => draftAutosave.saveDraft('manual')}
                onRequestPublish={() => setIsPublishConfirmOpen(true)}
                onToggleTopicActive={() => handleToggleTopicActive(isSelectedTopicArchived)}
              />
            );
          }

          return (
            <TestQuestionsOnlyView
              loading={detailQuery.isLoading}
              error={detailQuery.isError}
              errorMessage={detailErrorMessage}
              detail={detail}
              isReorderingQuestions={reorderQuestionsMutation.isPending}
              isDeletingQuestion={questionEditor.isDeletingQuestion}
              topicId={effectiveSelectedTopicId ?? 0}
              onRetryLoad={() => {
                void detailQuery.refetch();
              }}
              onCreateQuestion={questionEditor.openCreateQuestionModal}
              onEditQuestion={questionEditor.openEditQuestionModal}
              onRequestDeleteQuestion={questionEditor.setPendingDeleteQuestion}
              onReorderQuestions={handleReorderQuestions}
            />
          );
        })()}
      </div>

      <TestsCreateModal
        open={isListRoute && isCreateModalOpen}
        isCreating={createTopicMutation.isPending}
        newTestTitle={newTestTitle}
        newTestSlug={newTestSlug}
        newTestDescription={newTestDescription}
        onOpenChange={setIsCreateModalOpen}
        onNewTestTitleChange={setNewTestTitle}
        onNewTestSlugChange={setNewTestSlug}
        onNewTestDescriptionChange={setNewTestDescription}
        onCreateTest={handleCreateTest}
      />

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
        onConfirmTopicSwitch={handleConfirmLeave}
        onCloseTopicSwitch={handleConfirmStay}
        isDiscardQuestionConfirmOpen={questionEditor.isDiscardQuestionConfirmOpen}
        onConfirmDiscardQuestion={questionEditor.closeQuestionModalDirect}
        onCloseDiscardQuestion={() => questionEditor.setIsDiscardQuestionConfirmOpen(false)}
        pendingDeleteTopic={pendingDeleteTopic}
        isDeletingTopic={deleteTopicMutation.isPending}
        onConfirmDeleteTopic={handleConfirmDeleteTopic}
        onCloseDeleteTopic={() => setPendingDeleteTopic(null)}
        pendingArchiveTopic={pendingArchiveTopic}
        isArchivingTopic={archiveTopicMutation.isPending}
        onConfirmArchiveTopic={handleConfirmArchiveTopic}
        onCloseArchiveTopic={() => setPendingArchiveTopic(null)}
        pendingRestoreTopic={pendingRestoreTopic}
        isRestoringTopic={restoreTopicMutation.isPending}
        onConfirmRestoreTopic={handleConfirmRestoreTopic}
        onCloseRestoreTopic={() => setPendingRestoreTopic(null)}
        pendingDeleteQuestion={questionEditor.pendingDeleteQuestion}
        isDeletingQuestion={questionEditor.isDeletingQuestion}
        onConfirmDeleteQuestion={questionEditor.handleConfirmDeleteQuestion}
        onCloseDeleteQuestion={() => questionEditor.setPendingDeleteQuestion(null)}
        isPublishConfirmOpen={isPublishConfirmOpen}
        isPublishing={publishMutation.isPending}
        onConfirmPublish={handleConfirmPublish}
        onClosePublish={() => setIsPublishConfirmOpen(false)}
        isNavigationConfirmOpen={isNavigationConfirmOpen}
        onConfirmNavigationLeave={handleNavigationLeave}
        onConfirmNavigationStay={handleNavigationStay}
      />
    </>
  );
}
