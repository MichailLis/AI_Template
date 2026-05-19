import {
  createHandleConfirmArchiveTopic,
  createHandleConfirmDeleteTopic,
  createHandleConfirmPublish,
  createHandleConfirmRestoreTopic,
  createHandleConfirmTopicSwitch,
  createHandleCreateTest,
  createHandleCreateTestFromAi,
  createHandleImportProfOrientationV3Plus,
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
  useTestsControllerImportProfOrientationV3Plus,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';

type CreateTopicMutation = ReturnType<typeof useTestsControllerCreateTopic>;
type CreateTopicFromAiMutation = ReturnType<typeof useTestsControllerCreateTopicFromAi>;
type ImportProfOrientationV3PlusMutation = ReturnType<
  typeof useTestsControllerImportProfOrientationV3Plus
>;
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
  importProfOrientationV3PlusMutation: ImportProfOrientationV3PlusMutation;
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

function createCreationActions(params: UseAdminTestsWorkspaceActionsParams) {
  const handleCreateTest = createHandleCreateTest({
    newTestTitle: params.newTestTitle,
    newTestSlug: params.newTestSlug,
    newTestDescription: params.newTestDescription,
    setNewTestTitle: params.setNewTestTitle,
    setNewTestSlug: params.setNewTestSlug,
    setNewTestDescription: params.setNewTestDescription,
    createTopicMutation: params.createTopicMutation,
    draftAutosave: params.draftAutosave,
    refetchTopicsOnly: params.refetchTopicsOnly,
    navigateToTopic: params.navigateToTopic,
  });
  const handleCreateTestFromAi = createHandleCreateTestFromAi({
    createTopicFromAiMutation: params.createTopicFromAiMutation,
    setIsAiGeneratorOpen: params.setIsAiGeneratorOpen,
    draftAutosave: params.draftAutosave,
    refetchTestsData: params.refetchTestsData,
    navigateToTopic: params.navigateToTopic,
  });
  const handleImportProfOrientationV3Plus = createHandleImportProfOrientationV3Plus({
    importProfOrientationV3PlusMutation: params.importProfOrientationV3PlusMutation,
    draftAutosave: params.draftAutosave,
    refetchTestsData: params.refetchTestsData,
    navigateToTopic: params.navigateToTopic,
  });

  return {
    handleCreateTest,
    handleCreateTestFromAi,
    handleImportProfOrientationV3Plus,
  };
}

function createSelectionActions(params: UseAdminTestsWorkspaceActionsParams) {
  const handleSelectTest = createHandleSelectTest({
    effectiveSelectedTopicId: params.effectiveSelectedTopicId,
    isDraftDirty: params.isDraftDirty,
    setPendingTopicSwitchId: params.setPendingTopicSwitchId,
    setIsSwitchConfirmOpen: params.setIsSwitchConfirmOpen,
    draftAutosave: params.draftAutosave,
    navigateToTopic: params.navigateToTopic,
  });
  const handleConfirmTopicSwitch = createHandleConfirmTopicSwitch({
    pendingTopicSwitchId: params.pendingTopicSwitchId,
    setIsSwitchConfirmOpen: params.setIsSwitchConfirmOpen,
    draft: params.draft,
    clearDraftEdits: params.clearDraftEdits,
    draftAutosave: params.draftAutosave,
    setPendingTopicSwitchId: params.setPendingTopicSwitchId,
    navigateToTopic: params.navigateToTopic,
  });
  const handleConfirmDeleteTopic = createHandleConfirmDeleteTopic({
    pendingDeleteTopic: params.pendingDeleteTopic,
    deleteTopicMutation: params.deleteTopicMutation,
    effectiveSelectedTopicId: params.effectiveSelectedTopicId,
    draft: params.draft,
    clearDraftEdits: params.clearDraftEdits,
    topics: params.topics,
    questionEditor: params.questionEditor,
    setPendingTopicSwitchId: params.setPendingTopicSwitchId,
    setIsSwitchConfirmOpen: params.setIsSwitchConfirmOpen,
    setPendingDeleteTopic: params.setPendingDeleteTopic,
    draftAutosave: params.draftAutosave,
    refetchTestsData: params.refetchTestsData,
  });

  return {
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
  };
}

function createPublicationActions(params: UseAdminTestsWorkspaceActionsParams) {
  const handleConfirmPublish = createHandleConfirmPublish({
    effectiveSelectedTopicId: params.effectiveSelectedTopicId,
    setIsPublishConfirmOpen: params.setIsPublishConfirmOpen,
    publishMutation: params.publishMutation,
    questionEditor: params.questionEditor,
    draft: params.draft,
    clearDraftEdits: params.clearDraftEdits,
    draftAutosave: params.draftAutosave,
    refetchTestsData: params.refetchTestsData,
  });

  const handleReorderQuestions = createHandleReorderQuestions({
    effectiveSelectedTopicId: params.effectiveSelectedTopicId,
    detail: params.detail,
    reorderQuestionsMutation: params.reorderQuestionsMutation,
    refetchDetailOnly: params.refetchDetailOnly,
    refetchTestsData: params.refetchTestsData,
  });

  return {
    handleConfirmPublish,
    handleReorderQuestions,
  };
}

function createArchiveActions(params: UseAdminTestsWorkspaceActionsParams) {
  const handleConfirmArchiveTopic = createHandleConfirmArchiveTopic({
    pendingArchiveTopic: params.pendingArchiveTopic,
    archiveTopicMutation: params.archiveTopicMutation,
    setPendingArchiveTopic: params.setPendingArchiveTopic,
    setListMode: params.setListMode,
    refetchTopicsOnly: params.refetchTopicsOnly,
  });

  const handleConfirmRestoreTopic = createHandleConfirmRestoreTopic({
    pendingRestoreTopic: params.pendingRestoreTopic,
    restoreTopicMutation: params.restoreTopicMutation,
    setPendingRestoreTopic: params.setPendingRestoreTopic,
    setListMode: params.setListMode,
    refetchTopicsOnly: params.refetchTopicsOnly,
  });

  return {
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
  };
}

export function useAdminTestsWorkspaceActions(params: UseAdminTestsWorkspaceActionsParams) {
  const creationActions = createCreationActions(params);
  const selectionActions = createSelectionActions(params);
  const publicationActions = createPublicationActions(params);
  const archiveActions = createArchiveActions(params);
  const autosaveHint = buildAutosaveHint(params.draftAutosave);

  return {
    ...creationActions,
    ...selectionActions,
    ...publicationActions,
    ...archiveActions,
    autosaveHint,
  };
}
