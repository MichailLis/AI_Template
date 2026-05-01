import { useCallback } from 'react';

import { useQuestionEditor } from '@/features/tests';
import {
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';

import { useAdminTestsDialogState } from './use-admin-tests-dialog-state';
import { useAdminTestsDraft } from './use-admin-tests-draft';
import { useAdminTestsTopics } from './use-admin-tests-topics';
import { useAdminTestsWorkspaceActions } from './use-admin-tests-workspace-actions';

export type { ListMode } from './use-admin-tests-topics';

export function useAdminTestsWorkspace() {
  const {
    activeTopicsQuery,
    archivedTopicsQuery,
    topicsQuery,
    topics,
    topicsErrorMessage,
    effectiveSelectedTopicId,
    navigateToTopic,
    listMode,
    setListMode,
    isSelectedTopicArchived,
    refetchTopicsOnly,
  } = useAdminTestsTopics();

  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const archiveTopicMutation = useTestsControllerArchiveTopic();
  const restoreTopicMutation = useTestsControllerRestoreTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();

  const {
    detailQuery,
    detail,
    draft,
    detailErrorMessage,
    draftForm,
    isDraftDirty,
    canPublish,
    draftAutosave,
    clearDraftEdits,
    refetchTestsData,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
  } = useAdminTestsDraft({
    effectiveSelectedTopicId,
    activeTopicsQuery,
    archivedTopicsQuery,
    publishIsPending: publishMutation.isPending,
  });

  const questionEditor = useQuestionEditor({
    topicId: effectiveSelectedTopicId,
    onDataChanged: refetchTestsData,
  });

  const {
    newTestTitle,
    setNewTestTitle,
    newTestSlug,
    setNewTestSlug,
    newTestDescription,
    setNewTestDescription,
    testSearch,
    setTestSearch,
    isAiGeneratorOpen,
    setIsAiGeneratorOpen,
    isPublishConfirmOpen,
    setIsPublishConfirmOpen,
    pendingDeleteTopic,
    setPendingDeleteTopic,
    pendingTopicSwitchId,
    setPendingTopicSwitchId,
    isSwitchConfirmOpen,
    setIsSwitchConfirmOpen,
    isNavigationConfirmOpen,
    setIsNavigationConfirmOpen,
    pendingNavigationPath,
    setPendingNavigationPath,
    pendingArchiveTopic,
    setPendingArchiveTopic,
    pendingRestoreTopic,
    setPendingRestoreTopic,
  } = useAdminTestsDialogState();

  const handleAttemptNavigation = useCallback(
    (targetPath: string) => {
      if (isDraftDirty) {
        setPendingNavigationPath(targetPath);
        setIsNavigationConfirmOpen(true);
        return false;
      }

      return true;
    },
    [isDraftDirty, setIsNavigationConfirmOpen, setPendingNavigationPath],
  );

  const handleConfirmNavigationLeave = useCallback(() => {
    discardCurrentDraftEditsAndResetAutosave();
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  }, [
    discardCurrentDraftEditsAndResetAutosave,
    setIsNavigationConfirmOpen,
    setPendingNavigationPath,
  ]);

  const handleConfirmNavigationStay = useCallback(() => {
    setIsNavigationConfirmOpen(false);
    setPendingNavigationPath(null);
  }, [setIsNavigationConfirmOpen, setPendingNavigationPath]);

  const handleToggleTopicActive = useCallback(
    (nextActive: boolean) => {
      if (!effectiveSelectedTopicId) {
        return;
      }

      const mutation = nextActive ? restoreTopicMutation : archiveTopicMutation;
      mutation.mutate(
        { topicId: effectiveSelectedTopicId },
        {
          onSuccess: () => {
            setListMode(nextActive ? 'active' : 'archived');
            refetchTestsData();
          },
        },
      );
    },
    [
      archiveTopicMutation,
      effectiveSelectedTopicId,
      refetchTestsData,
      restoreTopicMutation,
      setListMode,
    ],
  );

  const {
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
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
    refetchTopicsOnly,
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
    pendingArchiveTopic,
    setPendingArchiveTopic,
    pendingRestoreTopic,
    setPendingRestoreTopic,
    archiveTopicMutation,
    restoreTopicMutation,
    setListMode,
    navigateToTopic,
  });

  return {
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
    pendingTopicSwitchId,
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
    discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation,
    handleConfirmNavigationLeave,
    handleConfirmNavigationStay,
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
    listMode,
    setListMode,
    pendingArchiveTopic,
    pendingRestoreTopic,
    isSelectedTopicArchived,
    archiveTopicMutation,
    restoreTopicMutation,
    setPendingArchiveTopic,
    setPendingRestoreTopic,
    isNavigationConfirmOpen,
    setIsNavigationConfirmOpen,
    pendingNavigationPath,
    setPendingNavigationPath,
  };
}
