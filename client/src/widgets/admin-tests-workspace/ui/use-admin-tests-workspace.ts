import { useCallback } from 'react';
import { useForm } from 'react-hook-form';

import { useQuestionEditor } from '@/features/tests';

import { buildAutosaveHint } from './admin-tests-workspace-actions.helpers';
import { useAdminTestsActions } from './use-admin-tests-actions';
import { useAdminTestsDialogState } from './use-admin-tests-dialog-state';
import { useAdminTestsDraft } from './use-admin-tests-draft';
import { useAdminTestsTopics } from './use-admin-tests-topics';

import type { CreateTestValues } from '@/features/tests';

export type { ListMode } from './use-admin-tests-topics';

const CREATE_TEST_DEFAULTS: CreateTestValues = { title: '', slug: '', description: '' };

export function useAdminTestsWorkspace() {
  const topicsState = useAdminTestsTopics();
  const draftState = useAdminTestsDraft(topicsState.effectiveSelectedTopicId);
  const { discardCurrentDraftEditsAndResetAutosave, isDraftDirty } = draftState;

  const questionEditor = useQuestionEditor({
    topicId: topicsState.effectiveSelectedTopicId,
    onDataChanged: draftState.invalidateTestsData,
  });

  const dialogState = useAdminTestsDialogState();
  const { setIsNavigationConfirmOpen, setPendingNavigationPath } = dialogState;
  const createForm = useForm<CreateTestValues>({ defaultValues: CREATE_TEST_DEFAULTS });

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

  const actions = useAdminTestsActions({
    topics: topicsState,
    draft: draftState,
    dialogs: dialogState,
    questionEditor,
    createForm,
  });

  return {
    ...topicsState,
    ...draftState,
    ...dialogState,
    createForm,
    questionEditor,
    ...actions,
    autosaveHint: buildAutosaveHint(draftState.draftAutosave),
    handleAttemptNavigation,
    handleConfirmNavigationLeave,
    handleConfirmNavigationStay,
  };
}
