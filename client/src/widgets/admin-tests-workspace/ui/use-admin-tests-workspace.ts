import { useCallback } from 'react';

import { useQuestionEditor } from '@/features/tests';
import {
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerImportProfOrientationV3Plus,
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
  const topicsState = useAdminTestsTopics();
  const { activeTopicsQuery, archivedTopicsQuery, effectiveSelectedTopicId, setListMode } =
    topicsState;

  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const importProfOrientationV3PlusMutation = useTestsControllerImportProfOrientationV3Plus();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const archiveTopicMutation = useTestsControllerArchiveTopic();
  const restoreTopicMutation = useTestsControllerRestoreTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const publishMutation = useTestsControllerPublishTopic();

  const mutations = {
    createTopicMutation,
    createTopicFromAiMutation,
    importProfOrientationV3PlusMutation,
    deleteTopicMutation,
    archiveTopicMutation,
    restoreTopicMutation,
    reorderQuestionsMutation,
    publishMutation,
  };

  const draftState = useAdminTestsDraft({
    effectiveSelectedTopicId,
    activeTopicsQuery,
    archivedTopicsQuery,
    publishIsPending: publishMutation.isPending,
  });
  const { discardCurrentDraftEditsAndResetAutosave, isDraftDirty, refetchTestsData } = draftState;

  const questionEditor = useQuestionEditor({
    topicId: effectiveSelectedTopicId,
    onDataChanged: refetchTestsData,
  });

  const dialogState = useAdminTestsDialogState();
  const { setIsNavigationConfirmOpen, setPendingNavigationPath } = dialogState;

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

  const actions = useAdminTestsWorkspaceActions({
    ...dialogState,
    ...mutations,
    ...draftState,
    ...topicsState,
    questionEditor,
    refetchDetailOnly: () => {
      void draftState.detailQuery.refetch();
    },
  });

  return {
    ...topicsState,
    ...draftState,
    ...dialogState,
    ...mutations,
    questionEditor,
    ...actions,
    handleAttemptNavigation,
    handleConfirmNavigationLeave,
    handleConfirmNavigationStay,
    handleToggleTopicActive,
  };
}
