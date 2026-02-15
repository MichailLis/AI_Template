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
  setSelectedTopicId: (value: number | null) => void;
  refetchTopicsOnly: () => void;
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
  setSelectedTopicId,
  refetchTopicsOnly,
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
        onSuccess: (topic) => {
          toast.success('Тест создан');
          setNewTestTitle('');
          setNewTestSlug('');
          setNewTestDescription('');
          draftAutosave.resetAutosaveMeta();
          setSelectedTopicId(topic.topicId);
          refetchTopicsOnly();
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
  setSelectedTopicId: (value: number | null) => void;
  refetchTestsData: () => void;
}

export const createHandleCreateTestFromAi = ({
  createTopicFromAiMutation,
  setIsAiGeneratorOpen,
  draftAutosave,
  setSelectedTopicId,
  refetchTestsData,
}: CreateTestFromAiDeps) => {
  return (payload: CreateTestsTopicFromAiDto) => {
    createTopicFromAiMutation.mutate(
      {
        data: payload,
      },
      {
        onSuccess: (topic) => {
          toast.success('Тест успешно создан с помощью ИИ');
          setIsAiGeneratorOpen(false);
          draftAutosave.resetAutosaveMeta();
          setSelectedTopicId(topic.topicId);
          refetchTestsData();
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
  setSelectedTopicId: (value: number | null) => void;
}

export const createHandleSelectTest = ({
  effectiveSelectedTopicId,
  isDraftDirty,
  setPendingTopicSwitchId,
  setIsSwitchConfirmOpen,
  draftAutosave,
  setSelectedTopicId,
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
    setSelectedTopicId(topicId);
  };
};

interface ConfirmTopicSwitchDeps {
  pendingTopicSwitchId: number | null;
  setIsSwitchConfirmOpen: (value: boolean) => void;
  draft: { id: number } | undefined;
  clearDraftEdits: (draftId: number) => void;
  draftAutosave: DraftAutosave;
  setSelectedTopicId: (value: number | null) => void;
  setPendingTopicSwitchId: (value: number | null) => void;
}

export const createHandleConfirmTopicSwitch = ({
  pendingTopicSwitchId,
  setIsSwitchConfirmOpen,
  draft,
  clearDraftEdits,
  draftAutosave,
  setSelectedTopicId,
  setPendingTopicSwitchId,
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
    setSelectedTopicId(pendingTopicSwitchId);
    setPendingTopicSwitchId(null);
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
  setSelectedTopicId: (value: number | null) => void;
  questionEditor: QuestionEditor;
  setIsPublishConfirmOpen: (value: boolean) => void;
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
  setSelectedTopicId,
  questionEditor,
  setIsPublishConfirmOpen,
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
            setSelectedTopicId(nextTopicId);
            questionEditor.closeQuestionModalDirect();
            questionEditor.setPendingDeleteQuestion(null);
            setIsPublishConfirmOpen(false);
            setPendingTopicSwitchId(null);
            setIsSwitchConfirmOpen(false);
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
