import { useManageTestTopic } from '@/features/manage-test-topic';
import { usePublishTest } from '@/features/publish-test';
import { useReorderQuestions } from '@/features/test-editor';

import { resolveNextTopicAfterDelete } from '../lib/admin-tests-workspace-actions.helpers';

import type { useAdminTestsDialogState } from './use-admin-tests-dialog-state';
import type { useAdminTestsDraft } from './use-admin-tests-draft';
import type { useAdminTestsTopics } from './use-admin-tests-topics';
import type { CreateTestValues, useQuestionEditor } from '@/features/test-editor';
import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';
import type { UseFormReturn } from 'react-hook-form';

export interface AdminTestsActionsState {
  topics: ReturnType<typeof useAdminTestsTopics>;
  draft: ReturnType<typeof useAdminTestsDraft>;
  dialogs: ReturnType<typeof useAdminTestsDialogState>;
  questionEditor: ReturnType<typeof useQuestionEditor>;
  createForm: UseFormReturn<CreateTestValues>;
}

type ManageTestTopic = ReturnType<typeof useManageTestTopic>;

function useCreateTestActions(
  { topics, draft, dialogs, createForm }: AdminTestsActionsState,
  manageTopic: ManageTestTopic,
) {
  const { resetAutosaveMeta } = draft.draftAutosave;

  const handleCreateTest = createForm.handleSubmit((values) => {
    manageTopic.createTopic(values, (topicId) => {
      createForm.reset();
      resetAutosaveMeta();
      topics.navigateToTopic(topicId);
    });
  });

  const handleCreateTestFromAi = (payload: CreateTestsTopicFromAiDto) => {
    manageTopic.createTopicFromAi(payload, (topicId) => {
      dialogs.setIsAiGeneratorOpen(false);
      resetAutosaveMeta();
      topics.navigateToTopic(topicId);
    });
  };

  const handleImportProfOrientationV3Plus = () => {
    manageTopic.importProfOrientationV3Plus({
      onImported: (topicId) => {
        dialogs.setIsImportConfirmOpen(false);
        resetAutosaveMeta();
        topics.navigateToTopic(topicId);
      },
      onUndone: () => {
        resetAutosaveMeta();
        topics.navigateToList();
      },
    });
  };

  return { handleCreateTest, handleCreateTestFromAi, handleImportProfOrientationV3Plus };
}

function useTopicSelectionActions(
  { topics, draft, dialogs }: AdminTestsActionsState,
  { deleteTopic }: ManageTestTopic,
) {
  const { resetAutosaveMeta } = draft.draftAutosave;
  const selectedTopicId = topics.effectiveSelectedTopicId;

  const clearCurrentDraftEdits = () => {
    if (draft.draft) {
      draft.clearDraftEdits(draft.draft.id);
    }
  };

  const handleSelectTest = (topicId: number) => {
    if (topicId === selectedTopicId) {
      return;
    }

    if (draft.isDraftDirty) {
      dialogs.setPendingTopicSwitchId(topicId);
      dialogs.setIsSwitchConfirmOpen(true);
      return;
    }

    resetAutosaveMeta();
    topics.navigateToTopic(topicId);
  };

  const handleConfirmTopicSwitch = () => {
    const targetTopicId = dialogs.pendingTopicSwitchId;
    if (targetTopicId !== null) {
      clearCurrentDraftEdits();
      resetAutosaveMeta();
      dialogs.setPendingTopicSwitchId(null);
      topics.navigateToTopic(targetTopicId);
    }

    dialogs.setIsSwitchConfirmOpen(false);
  };

  const handleConfirmDeleteTopic = () => {
    const topicIdToDelete = dialogs.pendingDeleteTopic?.id;
    if (!topicIdToDelete) {
      return;
    }

    deleteTopic(topicIdToDelete, () => {
      if (selectedTopicId === topicIdToDelete) {
        clearCurrentDraftEdits();
        const nextTopicId = resolveNextTopicAfterDelete(topics.topics, topicIdToDelete);
        if (nextTopicId !== null) {
          dialogs.setPendingTopicSwitchId(nextTopicId);
          dialogs.setIsSwitchConfirmOpen(true);
        }
      }

      dialogs.setPendingDeleteTopic(null);
      resetAutosaveMeta();
    });
  };

  /**
   * Переключатель «Активен для студентов» закрывает доступ по публичным ссылкам теста, поэтому он
   * не мутирует сразу, а открывает то же подтверждение, что и архивация из списка тестов.
   */
  const handleToggleTopicActive = (nextActive: boolean) => {
    const { selectedTopic } = topics;
    if (!selectedTopic) {
      return;
    }

    if (nextActive) {
      dialogs.setPendingRestoreTopic(selectedTopic);
    } else {
      dialogs.setPendingArchiveTopic(selectedTopic);
    }
  };

  return {
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleToggleTopicActive,
  };
}

function usePublicationActions({ topics, draft, dialogs, questionEditor }: AdminTestsActionsState) {
  const { publishTest, isPublishing } = usePublishTest();
  const { reorderQuestions, isReorderingQuestions } = useReorderQuestions();
  const topicId = topics.effectiveSelectedTopicId;

  const handleConfirmPublish = () => {
    if (!topicId) {
      dialogs.setIsPublishConfirmOpen(false);
      return;
    }

    publishTest(topicId, () => {
      dialogs.setIsPublishConfirmOpen(false);
      questionEditor.closeQuestionModalDirect();
      if (draft.draft) {
        draft.clearDraftEdits(draft.draft.id);
      }
      draft.draftAutosave.resetAutosaveMeta();
    });
  };

  const handleReorderQuestions = (questionIds: number[]) => {
    if (!topicId || !draft.detail) {
      return;
    }

    reorderQuestions(
      topicId,
      draft.detail.draft.questions.map((question) => question.id),
      questionIds,
    );
  };

  return { isPublishing, isReorderingQuestions, handleConfirmPublish, handleReorderQuestions };
}

function useArchiveActions(
  { topics, dialogs }: AdminTestsActionsState,
  { archiveTopic, restoreTopic }: ManageTestTopic,
) {
  const handleConfirmArchiveTopic = () => {
    const topic = dialogs.pendingArchiveTopic;
    if (!topic) {
      return;
    }

    archiveTopic(topic.id, () => {
      dialogs.setPendingArchiveTopic(null);
      topics.setListMode('archived');
    });
  };

  const handleConfirmRestoreTopic = () => {
    const topic = dialogs.pendingRestoreTopic;
    if (!topic) {
      return;
    }

    restoreTopic(topic.id, () => {
      dialogs.setPendingRestoreTopic(null);
      topics.setListMode('active');
    });
  };

  return { handleConfirmArchiveTopic, handleConfirmRestoreTopic };
}

/** Workspace-level wiring: feature scenarios plus the workspace state they change. */
export function useAdminTestsActions(state: AdminTestsActionsState) {
  const manageTopic = useManageTestTopic();
  const createActions = useCreateTestActions(state, manageTopic);
  const selectionActions = useTopicSelectionActions(state, manageTopic);
  const publicationActions = usePublicationActions(state);
  const archiveActions = useArchiveActions(state, manageTopic);

  return {
    isCreatingTopic: manageTopic.isCreatingTopic,
    isCreatingTopicFromAi: manageTopic.isCreatingTopicFromAi,
    isImportingProfOrientation: manageTopic.isImportingProfOrientation,
    isDeletingTopic: manageTopic.isDeletingTopic,
    isArchivingTopic: manageTopic.isArchivingTopic,
    isRestoringTopic: manageTopic.isRestoringTopic,
    ...createActions,
    ...selectionActions,
    ...publicationActions,
    ...archiveActions,
  };
}
