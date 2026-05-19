import { TestQuestionsOnlyView } from '@/features/tests';

import { AdminTestsListSection } from './admin-tests-list-section';
import { AdminTestsSettingsCard } from './admin-tests-settings-card';

import type { useAdminTestsWorkspace } from './use-admin-tests-workspace';

type AdminTestsWorkspaceState = ReturnType<typeof useAdminTestsWorkspace>;

interface AdminTestsWorkspaceContentProps {
  workspace: AdminTestsWorkspaceState;
  isListRoute: boolean;
  isSettingsRoute: boolean;
  onOpenCreateModal: () => void;
  onWorkspaceNavigate: (targetPath: string) => void;
}

export function AdminTestsWorkspaceContent({
  workspace,
  isListRoute,
  isSettingsRoute,
  onOpenCreateModal,
  onWorkspaceNavigate,
}: AdminTestsWorkspaceContentProps) {
  if (isListRoute) {
    return (
      <AdminTestsListSection
        topics={workspace.topics}
        listMode={workspace.listMode}
        topicsLoading={workspace.topicsQuery.isLoading}
        topicsError={workspace.topicsQuery.isError}
        topicsErrorMessage={workspace.topicsErrorMessage}
        searchValue={workspace.testSearch}
        isArchivingTopic={workspace.archiveTopicMutation.isPending}
        archivingTopicId={workspace.pendingArchiveTopic?.id ?? null}
        isRestoringTopic={workspace.restoreTopicMutation.isPending}
        restoringTopicId={workspace.pendingRestoreTopic?.id ?? null}
        isDeletingTopic={workspace.deleteTopicMutation.isPending}
        deletingTopicId={workspace.pendingDeleteTopic?.id ?? null}
        onSearchChange={workspace.setTestSearch}
        onListModeChange={workspace.setListMode}
        onOpenCreateModal={onOpenCreateModal}
        onOpenAiGenerator={() => workspace.setIsAiGeneratorOpen(true)}
        onImportProfOrientation={workspace.handleImportProfOrientationV3Plus}
        isImportingProfOrientation={workspace.importProfOrientationV3PlusMutation.isPending}
        onSelectTest={workspace.handleSelectTest}
        onOpenSettings={(topicId) => onWorkspaceNavigate(`/admin/tests/${topicId}/settings`)}
        onRequestArchiveTest={workspace.setPendingArchiveTopic}
        onRequestRestoreTest={workspace.setPendingRestoreTopic}
        onRequestDeleteTest={workspace.setPendingDeleteTopic}
        onRetryTopics={() => {
          void workspace.topicsQuery.refetch();
        }}
      />
    );
  }

  if (isSettingsRoute && workspace.effectiveSelectedTopicId !== null) {
    return (
      <AdminTestsSettingsCard
        published={workspace.detail?.published ?? null}
        draftAnalysisPromptVersion={workspace.draft?.analysisPromptVersion ?? null}
        draftForm={workspace.draftForm}
        isDraftDirty={workspace.isDraftDirty}
        isSelectedTopicArchived={workspace.isSelectedTopicArchived}
        canPublish={workspace.canPublish}
        isSavingDraft={workspace.draftAutosave.isSavingDraft}
        autoSaveError={workspace.draftAutosave.autoSaveError}
        autosaveHint={workspace.autosaveHint}
        isPublishing={workspace.publishMutation.isPending}
        isArchivingTopic={workspace.archiveTopicMutation.isPending}
        isRestoringTopic={workspace.restoreTopicMutation.isPending}
        onBackToQuestions={() =>
          onWorkspaceNavigate(`/admin/tests/${workspace.effectiveSelectedTopicId}`)
        }
        onDraftTitleChange={(value) => workspace.updateCurrentDraftEdits({ title: value })}
        onDraftDescriptionChange={(value) =>
          workspace.updateCurrentDraftEdits({ description: value })
        }
        onDraftAnalysisPromptVersionChange={(value) =>
          workspace.updateCurrentDraftEdits({ analysisPromptVersionId: value })
        }
        onSaveDraft={() => workspace.draftAutosave.saveDraft('manual')}
        onRequestPublish={() => workspace.setIsPublishConfirmOpen(true)}
        onToggleTopicActive={() =>
          workspace.handleToggleTopicActive(workspace.isSelectedTopicArchived)
        }
      />
    );
  }

  return (
    <TestQuestionsOnlyView
      loading={workspace.detailQuery.isLoading}
      error={workspace.detailQuery.isError}
      errorMessage={workspace.detailErrorMessage}
      detail={workspace.detail}
      isReorderingQuestions={workspace.reorderQuestionsMutation.isPending}
      isDeletingQuestion={workspace.questionEditor.isDeletingQuestion}
      topicId={workspace.effectiveSelectedTopicId ?? 0}
      onRetryLoad={() => {
        void workspace.detailQuery.refetch();
      }}
      onCreateQuestion={workspace.questionEditor.openCreateQuestionModal}
      onEditQuestion={workspace.questionEditor.openEditQuestionModal}
      onRequestDeleteQuestion={workspace.questionEditor.setPendingDeleteQuestion}
      onReorderQuestions={workspace.handleReorderQuestions}
    />
  );
}
