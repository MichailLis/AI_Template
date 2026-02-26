import { toast } from 'sonner';

import {
  parseApiError,
  type TestTopicListItem,
  type useDraftAutosave,
  type useQuestionEditor,
} from '@/features/tests';

import {
  hasInvalidQuestionReorderPayload,
  isBackendReorderRouteError,
  resolveNextTopicAfterDelete,
} from './admin-tests-workspace-actions.helpers';

import type {
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
} from '@/shared/api/generated/tests/tests';
import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

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

interface ConfirmPublishDeps {
  effectiveSelectedTopicId: number | null;
  setIsPublishConfirmOpen: (value: boolean) => void;
  publishMutation: PublishMutation;
  questionEditor: QuestionEditor;
  draft: { id: number } | undefined;
  clearDraftEdits: (draftId: number) => void;
  draftAutosave: DraftAutosave;
  refetchTestsData: () => void;
}

export const createHandleConfirmPublish = ({
  effectiveSelectedTopicId,
  setIsPublishConfirmOpen,
  publishMutation,
  questionEditor,
  draft,
  clearDraftEdits,
  draftAutosave,
  refetchTestsData,
}: ConfirmPublishDeps) => {
  return () => {
    if (!effectiveSelectedTopicId) {
      setIsPublishConfirmOpen(false);
      return;
    }

    publishMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
      },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создана новая версия в работе v${result.newDraftVersionNumber}`,
          );
          setIsPublishConfirmOpen(false);
          questionEditor.closeQuestionModalDirect();

          if (draft) {
            clearDraftEdits(draft.id);
          }

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

interface ReorderQuestionsDeps {
  effectiveSelectedTopicId: number | null;
  detail: TestsDetail | undefined;
  reorderQuestionsMutation: ReorderQuestionsMutation;
  refetchDetailOnly: () => void;
  refetchTestsData: () => void;
}

export const createHandleReorderQuestions = ({
  effectiveSelectedTopicId,
  detail,
  reorderQuestionsMutation,
  refetchDetailOnly,
  refetchTestsData,
}: ReorderQuestionsDeps) => {
  return (questionIds: number[]) => {
    if (!effectiveSelectedTopicId || !detail || reorderQuestionsMutation.isPending) {
      return;
    }

    const currentIds = detail.draft.questions.map((question) => question.id);
    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    if (hasInvalidQuestionReorderPayload(currentIds, questionIds)) {
      toast.error('Не удалось изменить порядок: список вопросов устарел. Обновите страницу теста.');
      refetchDetailOnly();
      return;
    }

    reorderQuestionsMutation.mutate(
      {
        topicId: effectiveSelectedTopicId,
        data: {
          questionIds,
        },
      },
      {
        onSuccess: () => {
          toast.success('Порядок вопросов обновлен');
          refetchTestsData();
        },
        onError: (error) => {
          const message = parseApiError(error);
          if (isBackendReorderRouteError(message)) {
            toast.error(
              'Ошибка маршрута reorder на backend. Перезапустите сервер и обновите страницу.',
            );
          } else {
            toast.error(`Не удалось изменить порядок: ${message}`);
          }

          refetchTestsData();
        },
      },
    );
  };
};

interface ConfirmArchiveTopicDeps {
  pendingArchiveTopic: TestTopicListItem | null;
  archiveTopicMutation: {
    isPending: boolean;
    mutate: (
      args: { topicId: number },
      options?: {
        onSuccess?: () => void;
        onError?: (error: unknown) => void;
      },
    ) => void;
  };
  setPendingArchiveTopic: (value: TestTopicListItem | null) => void;
  setListMode: (value: 'active' | 'archived') => void;
  refetchTopicsOnly: () => void;
}

export const createHandleConfirmArchiveTopic = ({
  pendingArchiveTopic,
  archiveTopicMutation,
  setPendingArchiveTopic,
  setListMode,
  refetchTopicsOnly,
}: ConfirmArchiveTopicDeps) => {
  return () => {
    if (!pendingArchiveTopic) {
      return;
    }

    archiveTopicMutation.mutate(
      { topicId: pendingArchiveTopic.id },
      {
        onSuccess: () => {
          toast.success('Тест заархивирован');
          setPendingArchiveTopic(null);
          setListMode('archived');
          refetchTopicsOnly();
        },
        onError: (error: unknown) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };
};

interface ConfirmRestoreTopicDeps {
  pendingRestoreTopic: TestTopicListItem | null;
  restoreTopicMutation: {
    isPending: boolean;
    mutate: (
      args: { topicId: number },
      options?: {
        onSuccess?: () => void;
        onError?: (error: unknown) => void;
      },
    ) => void;
  };
  setPendingRestoreTopic: (value: TestTopicListItem | null) => void;
  setListMode: (value: 'active' | 'archived') => void;
  refetchTopicsOnly: () => void;
}

export const createHandleConfirmRestoreTopic = ({
  pendingRestoreTopic,
  restoreTopicMutation,
  setPendingRestoreTopic,
  setListMode,
  refetchTopicsOnly,
}: ConfirmRestoreTopicDeps) => {
  return () => {
    if (!pendingRestoreTopic) {
      return;
    }

    restoreTopicMutation.mutate(
      { topicId: pendingRestoreTopic.id },
      {
        onSuccess: () => {
          toast.success('Тест восстановлен');
          setPendingRestoreTopic(null);
          setListMode('active');
          refetchTopicsOnly();
        },
        onError: (error: unknown) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };
};
