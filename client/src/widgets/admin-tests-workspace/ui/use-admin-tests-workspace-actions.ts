import {
  createHandleConfirmArchiveTopic,
  createHandleConfirmDeleteTopic,
  createHandleConfirmPublish,
  createHandleConfirmRestoreTopic,
  createHandleConfirmTopicSwitch,
  createHandleCreateTest,
  createHandleCreateTestFromAi,
  createHandleReorderQuestions,
  createHandleSelectTest,
} from './admin-tests-workspace-action-creators';
import { buildAutosaveHint } from './admin-tests-workspace-actions.helpers';

import type { useDraftAutosave, useQuestionEditor } from '@/features/tests';
import type { TestTopicListItem } from '@/features/tests';
import type {
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';

type CreateTopicMutation = ReturnType<typeof useTestsControllerCreateTopic>;
type CreateTopicFromAiMutation = ReturnType<typeof useTestsControllerCreateTopicFromAi>;
type DeleteTopicMutation = ReturnType<typeof useTestsControllerDeleteTopic>;
type ReorderQuestionsMutation = ReturnType<typeof useTestsControllerReorderQuestions>;
type PublishMutation = ReturnType<typeof useTestsControllerPublishTopic>;
type ArchiveTopicMutation = ReturnType<typeof useTestsControllerArchiveTopic>;
type RestoreTopicMutation = ReturnType<typeof useTestsControllerRestoreTopic>;
type DraftAutosave = ReturnType<typeof useDraftAutosave>;
type QuestionEditor = ReturnType<typeof useQuestionEditor>;

interface TestsDetail {
  draft: {
    id: number;
    questions: Array<{ id: number }>;
  };
}

interface UseAdminTestsWorkspaceActionsParams {
  newTestTitle: string;
  newTestSlug: string;
  newTestDescription: string;
  setNewTestTitle: (value: string) => void;
  setNewTestSlug: (value: string) => void;
  setNewTestDescription: (value: string) => void;
  setIsAiGeneratorOpen: (value: boolean) => void;
  createTopicMutation: CreateTopicMutation;
  createTopicFromAiMutation: CreateTopicFromAiMutation;
  deleteTopicMutation: DeleteTopicMutation;
  reorderQuestionsMutation: ReorderQuestionsMutation;
  publishMutation: PublishMutation;
  draftAutosave: DraftAutosave;
  refetchTopicsOnly: () => void;

  refetchTestsData: () => void;
  effectiveSelectedTopicId: number | null;
  isDraftDirty: boolean;
  setPendingTopicSwitchId: (value: number | null) => void;
  setIsSwitchConfirmOpen: (value: boolean) => void;
  pendingTopicSwitchId: number | null;
  draft: { id: number } | undefined;
  clearDraftEdits: (draftId: number) => void;
  pendingDeleteTopic: TestTopicListItem | null;
  setPendingDeleteTopic: (value: TestTopicListItem | null) => void;
  topics: TestTopicListItem[];
  questionEditor: QuestionEditor;
  setIsPublishConfirmOpen: (value: boolean) => void;
  detail: TestsDetail | undefined;
  refetchDetailOnly: () => void;
  pendingArchiveTopic: TestTopicListItem | null;
  setPendingArchiveTopic: (value: TestTopicListItem | null) => void;
  pendingRestoreTopic: TestTopicListItem | null;
  setPendingRestoreTopic: (value: TestTopicListItem | null) => void;
  archiveTopicMutation: ArchiveTopicMutation;
  restoreTopicMutation: RestoreTopicMutation;
  setListMode: (value: 'active' | 'archived') => void;
  navigateToTopic: (topicId: number) => void;
}

export function useAdminTestsWorkspaceActions({
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
  refetchDetailOnly,
  pendingArchiveTopic,
  setPendingArchiveTopic,
  pendingRestoreTopic,
  setPendingRestoreTopic,
  archiveTopicMutation,
  restoreTopicMutation,
  setListMode,
  navigateToTopic,
}: UseAdminTestsWorkspaceActionsParams) {
  const handleCreateTest = createHandleCreateTest({
    newTestTitle,
    newTestSlug,
    newTestDescription,
    setNewTestTitle,
    setNewTestSlug,
    setNewTestDescription,
    createTopicMutation,
    draftAutosave,
    refetchTopicsOnly,
    navigateToTopic,
  });
  const handleCreateTestFromAi = createHandleCreateTestFromAi({
    createTopicFromAiMutation,
    setIsAiGeneratorOpen,
    draftAutosave,
    refetchTestsData,
    navigateToTopic,
  });
  const handleSelectTest = createHandleSelectTest({
    effectiveSelectedTopicId,
    isDraftDirty,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    draftAutosave,
    navigateToTopic,
  });
  const handleConfirmTopicSwitch = createHandleConfirmTopicSwitch({
    pendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    draft,
    clearDraftEdits,
    draftAutosave,
    setPendingTopicSwitchId,
    navigateToTopic,
  });
  const handleConfirmDeleteTopic = createHandleConfirmDeleteTopic({
    pendingDeleteTopic,
    deleteTopicMutation,
    effectiveSelectedTopicId,
    draft,
    clearDraftEdits,
    topics,
    questionEditor,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    setPendingDeleteTopic,
    draftAutosave,
    refetchTestsData,
  });

  const handleConfirmPublish = createHandleConfirmPublish({
    effectiveSelectedTopicId,
    setIsPublishConfirmOpen,
    publishMutation,
    questionEditor,
    draft,
    clearDraftEdits,
    draftAutosave,
    refetchTestsData,
  });

  const handleReorderQuestions = createHandleReorderQuestions({
    effectiveSelectedTopicId,
    detail,
    reorderQuestionsMutation,
    refetchDetailOnly,
    refetchTestsData,
  });

  const handleConfirmArchiveTopic = createHandleConfirmArchiveTopic({
    pendingArchiveTopic,
    archiveTopicMutation,
    setPendingArchiveTopic,
    setListMode,
    refetchTopicsOnly,
  });

  const handleConfirmRestoreTopic = createHandleConfirmRestoreTopic({
    pendingRestoreTopic,
    restoreTopicMutation,
    setPendingRestoreTopic,
    setListMode,
    refetchTopicsOnly,
  });

  const autosaveHint = buildAutosaveHint(draftAutosave);

  return {
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
  };
}
