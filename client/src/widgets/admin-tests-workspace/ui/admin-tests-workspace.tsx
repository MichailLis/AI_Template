import { AiTestGeneratorModal, QuestionModal, TestEditor, TestsSidebar } from '@/features/tests';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';
import { PublicLinksHandoffCard } from './public-links-handoff-card';
import { useAdminTestsWorkspace } from './use-admin-tests-workspace';

export function AdminTestsWorkspace() {
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
    newTestTitle,
    newTestSlug,
    newTestDescription,
    testSearch,
    isAiGeneratorOpen,
    isPublishConfirmOpen,
    pendingDeleteTopic,
    isSwitchConfirmOpen,
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
    setIsSwitchConfirmOpen,
    setIsPublishConfirmOpen,
    updateCurrentDraftEdits,
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
  } = useAdminTestsWorkspace();

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
