import { AiTestGeneratorModal, QuestionModal, TestsCreateModal } from '@/features/tests';

import { AdminTestsConfirmDialogs } from './admin-tests-confirm-dialogs';

import type { useAdminTestsWorkspace } from './use-admin-tests-workspace';
import type { Dispatch, SetStateAction } from 'react';

type AdminTestsWorkspaceState = ReturnType<typeof useAdminTestsWorkspace>;

interface AdminTestsWorkspaceModalsProps {
  workspace: AdminTestsWorkspaceState;
  isListRoute: boolean;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: Dispatch<SetStateAction<boolean>>;
  onNavigationLeave: () => void;
  onNavigationStay: () => void;
}

export function AdminTestsWorkspaceModals({
  workspace,
  isListRoute,
  isCreateModalOpen,
  setIsCreateModalOpen,
  onNavigationLeave,
  onNavigationStay,
}: AdminTestsWorkspaceModalsProps) {
  const handleConfirmStay = () => {
    workspace.setIsSwitchConfirmOpen(false);
    workspace.setPendingTopicSwitchId(null);
  };

  const handleConfirmLeave = () => {
    workspace.setIsSwitchConfirmOpen(false);
    workspace.setPendingTopicSwitchId(null);
    workspace.handleConfirmTopicSwitch();
  };

  return (
    <>
      <TestsCreateModal
        open={isListRoute && isCreateModalOpen}
        isCreating={workspace.createTopicMutation.isPending}
        newTestTitle={workspace.newTestTitle}
        newTestSlug={workspace.newTestSlug}
        newTestDescription={workspace.newTestDescription}
        onOpenChange={setIsCreateModalOpen}
        onNewTestTitleChange={workspace.setNewTestTitle}
        onNewTestSlugChange={workspace.setNewTestSlug}
        onNewTestDescriptionChange={workspace.setNewTestDescription}
        onCreateTest={workspace.handleCreateTest}
      />

      <AiTestGeneratorModal
        open={workspace.isAiGeneratorOpen}
        isCreating={workspace.createTopicFromAiMutation.isPending}
        onOpenChange={workspace.setIsAiGeneratorOpen}
        onCreate={workspace.handleCreateTestFromAi}
      />

      <QuestionModal
        open={workspace.questionEditor.isQuestionModalOpen}
        mode={workspace.questionEditor.editingQuestionId ? 'edit' : 'create'}
        form={workspace.questionEditor.questionForm}
        submitError={workspace.questionEditor.questionSubmitError}
        isSubmitting={workspace.questionEditor.isQuestionSubmitting}
        onSubmit={workspace.questionEditor.handleSubmitQuestion}
        onRequestClose={workspace.questionEditor.handleQuestionModalRequestClose}
        onFormChange={workspace.questionEditor.handleQuestionFormChange}
      />

      <AdminTestsConfirmDialogs
        isSwitchConfirmOpen={workspace.isSwitchConfirmOpen}
        onConfirmTopicSwitch={handleConfirmLeave}
        onCloseTopicSwitch={handleConfirmStay}
        isDiscardQuestionConfirmOpen={workspace.questionEditor.isDiscardQuestionConfirmOpen}
        onConfirmDiscardQuestion={workspace.questionEditor.closeQuestionModalDirect}
        onCloseDiscardQuestion={() =>
          workspace.questionEditor.setIsDiscardQuestionConfirmOpen(false)
        }
        pendingDeleteTopic={workspace.pendingDeleteTopic}
        isDeletingTopic={workspace.deleteTopicMutation.isPending}
        onConfirmDeleteTopic={workspace.handleConfirmDeleteTopic}
        onCloseDeleteTopic={() => workspace.setPendingDeleteTopic(null)}
        pendingArchiveTopic={workspace.pendingArchiveTopic}
        isArchivingTopic={workspace.archiveTopicMutation.isPending}
        onConfirmArchiveTopic={workspace.handleConfirmArchiveTopic}
        onCloseArchiveTopic={() => workspace.setPendingArchiveTopic(null)}
        pendingRestoreTopic={workspace.pendingRestoreTopic}
        isRestoringTopic={workspace.restoreTopicMutation.isPending}
        onConfirmRestoreTopic={workspace.handleConfirmRestoreTopic}
        onCloseRestoreTopic={() => workspace.setPendingRestoreTopic(null)}
        pendingDeleteQuestion={workspace.questionEditor.pendingDeleteQuestion}
        isDeletingQuestion={workspace.questionEditor.isDeletingQuestion}
        onConfirmDeleteQuestion={workspace.questionEditor.handleConfirmDeleteQuestion}
        onCloseDeleteQuestion={() => workspace.questionEditor.setPendingDeleteQuestion(null)}
        isPublishConfirmOpen={workspace.isPublishConfirmOpen}
        isPublishing={workspace.publishMutation.isPending}
        onConfirmPublish={workspace.handleConfirmPublish}
        onClosePublish={() => workspace.setIsPublishConfirmOpen(false)}
        isNavigationConfirmOpen={workspace.isNavigationConfirmOpen}
        onConfirmNavigationLeave={onNavigationLeave}
        onConfirmNavigationStay={onNavigationStay}
      />
    </>
  );
}
