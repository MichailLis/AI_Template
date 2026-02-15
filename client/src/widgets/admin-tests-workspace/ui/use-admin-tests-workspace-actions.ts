import {
  createHandleConfirmDeleteTopic,
  createHandleConfirmPublish,
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
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
} from '@/shared/api/generated/tests/tests';

type CreateTopicMutation = ReturnType<typeof useTestsControllerCreateTopic>;
type CreateTopicFromAiMutation = ReturnType<typeof useTestsControllerCreateTopicFromAi>;
type DeleteTopicMutation = ReturnType<typeof useTestsControllerDeleteTopic>;
type ReorderQuestionsMutation = ReturnType<typeof useTestsControllerReorderQuestions>;
type PublishMutation = ReturnType<typeof useTestsControllerPublishTopic>;
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
  setSelectedTopicId: (value: number | null) => void;
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
  setSelectedTopicId,
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
    setSelectedTopicId,
    refetchTopicsOnly,
  });

  const handleCreateTestFromAi = createHandleCreateTestFromAi({
    createTopicFromAiMutation,
    setIsAiGeneratorOpen,
    draftAutosave,
    setSelectedTopicId,
    refetchTestsData,
  });

  const handleSelectTest = createHandleSelectTest({
    effectiveSelectedTopicId,
    isDraftDirty,
    setPendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    draftAutosave,
    setSelectedTopicId,
  });

  const handleConfirmTopicSwitch = createHandleConfirmTopicSwitch({
    pendingTopicSwitchId,
    setIsSwitchConfirmOpen,
    draft,
    clearDraftEdits,
    draftAutosave,
    setSelectedTopicId,
    setPendingTopicSwitchId,
  });

  const handleConfirmDeleteTopic = createHandleConfirmDeleteTopic({
    pendingDeleteTopic,
    deleteTopicMutation,
    effectiveSelectedTopicId,
    draft,
    clearDraftEdits,
    topics,
    setSelectedTopicId,
    questionEditor,
    setIsPublishConfirmOpen,
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

  const autosaveHint = buildAutosaveHint(draftAutosave);

  return {
    handleCreateTest,
    handleCreateTestFromAi,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleConfirmPublish,
    handleReorderQuestions,
    autosaveHint,
  };
}
