import { toast } from 'sonner';

import { parseApiError } from '@/shared/lib/api-error';

import { resolveNextTopicAfterDelete } from './admin-tests-workspace-actions.helpers';

import type { TestTopicListItem, useDraftAutosave, useQuestionEditor } from '@/features/tests';
import type {
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerImportProfOrientationV3Plus,
} from '@/shared/api/generated/tests/tests';
import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

type CreateTopicMutation = ReturnType<typeof useTestsControllerCreateTopic>;
type CreateTopicFromAiMutation = ReturnType<typeof useTestsControllerCreateTopicFromAi>;
type ImportProfOrientationV3PlusMutation = ReturnType<
  typeof useTestsControllerImportProfOrientationV3Plus
>;
type DeleteTopicMutation = ReturnType<typeof useTestsControllerDeleteTopic>;
type DraftAutosave = ReturnType<typeof useDraftAutosave>;
type QuestionEditor = ReturnType<typeof useQuestionEditor>;

interface CreateTestDeps {
  newTestTitle: string;
  newTestSlug: string;
  newTestDescription: string;
  setNewTestTitle: (value: string) => void;
  setNewTestSlug: (value: string) => void;
  setNewTestDescription: (value: string) => void;
  createTopicMutation: CreateTopicMutation;
  draftAutosave: DraftAutosave;
  refetchTopicsOnly: () => void;
  navigateToTopic: (topicId: number) => void;
}

export const createHandleCreateTest = ({
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
}: CreateTestDeps) => {
  return () => {
    if (!newTestTitle.trim()) {
      toast.error('Укажите название теста');
      return;
    }

    createTopicMutation.mutate(
      {
        data: {
          title: newTestTitle.trim(),
          slug: newTestSlug.trim() || undefined,
          description: newTestDescription.trim() || null,
        },
      },
      {
        onSuccess: (result) => {
          toast.success('Тест создан');
          setNewTestTitle('');
          setNewTestSlug('');
          setNewTestDescription('');
          draftAutosave.resetAutosaveMeta();
          refetchTopicsOnly();
          navigateToTopic(result.topicId);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };
};

interface CreateTestFromAiDeps {
  createTopicFromAiMutation: CreateTopicFromAiMutation;
  setIsAiGeneratorOpen: (value: boolean) => void;
  draftAutosave: DraftAutosave;
  refetchTestsData: () => void;
  navigateToTopic: (topicId: number) => void;
}

export const createHandleCreateTestFromAi = ({
  createTopicFromAiMutation,
  setIsAiGeneratorOpen,
  draftAutosave,
  refetchTestsData,
  navigateToTopic,
}: CreateTestFromAiDeps) => {
  return (payload: CreateTestsTopicFromAiDto) => {
    createTopicFromAiMutation.mutate(
      {
        data: payload,
      },
      {
        onSuccess: (result) => {
          toast.success('Тест успешно создан с помощью ИИ');
          setIsAiGeneratorOpen(false);
          draftAutosave.resetAutosaveMeta();
          refetchTestsData();
          navigateToTopic(result.topicId);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };
};

interface ImportProfOrientationV3PlusDeps {
  importProfOrientationV3PlusMutation: ImportProfOrientationV3PlusMutation;
  draftAutosave: DraftAutosave;
  refetchTestsData: () => void;
  navigateToTopic: (topicId: number) => void;
}

export const createHandleImportProfOrientationV3Plus = ({
  importProfOrientationV3PlusMutation,
  draftAutosave,
  refetchTestsData,
  navigateToTopic,
}: ImportProfOrientationV3PlusDeps) => {
  return () => {
    importProfOrientationV3PlusMutation.mutate(undefined, {
      onSuccess: (result) => {
        toast.success('Методика v3+ импортирована');
        draftAutosave.resetAutosaveMeta();
        refetchTestsData();
        navigateToTopic(result.topicId);
      },
      onError: (error) => {
        toast.error(parseApiError(error));
      },
    });
  };
};

interface SelectTestDeps {
  effectiveSelectedTopicId: number | null;
  isDraftDirty: boolean;
  setPendingTopicSwitchId: (value: number | null) => void;
  setIsSwitchConfirmOpen: (value: boolean) => void;
  draftAutosave: DraftAutosave;
  navigateToTopic: (topicId: number) => void;
}

export const createHandleSelectTest = ({
  effectiveSelectedTopicId,
  isDraftDirty,
  setPendingTopicSwitchId,
  setIsSwitchConfirmOpen,
  draftAutosave,
  navigateToTopic,
}: SelectTestDeps) => {
  return (topicId: number) => {
    if (topicId === effectiveSelectedTopicId) {
      return;
    }

    if (isDraftDirty) {
      setPendingTopicSwitchId(topicId);
      setIsSwitchConfirmOpen(true);
      return;
    }

    draftAutosave.resetAutosaveMeta();
    navigateToTopic(topicId);
    return;
  };
};

interface ConfirmTopicSwitchDeps {
  pendingTopicSwitchId: number | null;
  setIsSwitchConfirmOpen: (value: boolean) => void;
  draft: { id: number } | undefined;
  clearDraftEdits: (draftId: number) => void;
  draftAutosave: DraftAutosave;
  setPendingTopicSwitchId: (value: number | null) => void;
  navigateToTopic: (topicId: number) => void;
}

export const createHandleConfirmTopicSwitch = ({
  pendingTopicSwitchId,
  setIsSwitchConfirmOpen,
  draft,
  clearDraftEdits,
  draftAutosave,
  setPendingTopicSwitchId,
  navigateToTopic,
}: ConfirmTopicSwitchDeps) => {
  return () => {
    if (pendingTopicSwitchId === null) {
      setIsSwitchConfirmOpen(false);
      return;
    }

    if (draft) {
      clearDraftEdits(draft.id);
    }

    draftAutosave.resetAutosaveMeta();
    setPendingTopicSwitchId(null);
    navigateToTopic(pendingTopicSwitchId);

    setIsSwitchConfirmOpen(false);
  };
};

interface ConfirmDeleteTopicDeps {
  pendingDeleteTopic: TestTopicListItem | null;
  deleteTopicMutation: DeleteTopicMutation;
  effectiveSelectedTopicId: number | null;
  draft: { id: number } | undefined;
  clearDraftEdits: (draftId: number) => void;
  topics: TestTopicListItem[];
  questionEditor: QuestionEditor;
  setPendingTopicSwitchId: (value: number | null) => void;
  setIsSwitchConfirmOpen: (value: boolean) => void;
  setPendingDeleteTopic: (value: TestTopicListItem | null) => void;
  draftAutosave: DraftAutosave;
  refetchTestsData: () => void;
}

export const createHandleConfirmDeleteTopic = ({
  pendingDeleteTopic,
  deleteTopicMutation,
  effectiveSelectedTopicId,
  draft,
  clearDraftEdits,
  topics,
  setPendingTopicSwitchId,
  setIsSwitchConfirmOpen,
  setPendingDeleteTopic,
  draftAutosave,
  refetchTestsData,
}: ConfirmDeleteTopicDeps) => {
  return () => {
    if (!pendingDeleteTopic) {
      return;
    }

    const topicIdToDelete = pendingDeleteTopic.id;

    deleteTopicMutation.mutate(
      {
        topicId: topicIdToDelete,
      },
      {
        onSuccess: () => {
          toast.success('Тест удален');

          if (effectiveSelectedTopicId === topicIdToDelete) {
            if (draft) {
              clearDraftEdits(draft.id);
            }

            const nextTopicId = resolveNextTopicAfterDelete(topics, topicIdToDelete);
            if (nextTopicId !== null) {
              setPendingTopicSwitchId(nextTopicId);
              setIsSwitchConfirmOpen(true);
            }
          }

          setPendingDeleteTopic(null);
          draftAutosave.resetAutosaveMeta();
          refetchTestsData();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };
};
