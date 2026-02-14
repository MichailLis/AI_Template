import { toast } from 'sonner';

import { parseApiError, type TestTopicListItem } from '@/features/tests';

import type { useDraftAutosave, useQuestionEditor } from '@/features/tests';
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
  const handleCreateTest = () => {
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

  const handleCreateTestFromAi = (payload: CreateTestsTopicFromAiDto) => {
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

  const handleSelectTest = (topicId: number) => {
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

  const handleConfirmTopicSwitch = () => {
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

  const handleConfirmDeleteTopic = () => {
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

            const nextTopic = topics.find((topic) => topic.id !== topicIdToDelete);
            setSelectedTopicId(nextTopic?.id ?? null);
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

  const handleConfirmPublish = () => {
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

  const handleReorderQuestions = (questionIds: number[]) => {
    if (!effectiveSelectedTopicId || !detail || reorderQuestionsMutation.isPending) {
      return;
    }

    const currentIds = detail.draft.questions.map((question) => question.id);
    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    const currentIdSet = new Set(currentIds);
    const nextIdSet = new Set(questionIds);
    const hasInvalidPayload =
      nextIdSet.size !== questionIds.length ||
      questionIds.length !== currentIds.length ||
      questionIds.some((id) => !currentIdSet.has(id));

    if (hasInvalidPayload) {
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
          const normalizedMessage = message.toLowerCase();

          if (
            normalizedMessage.includes('numeric string is expected') ||
            normalizedMessage.includes('questionid') ||
            normalizedMessage.includes('validation failed')
          ) {
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

  let autosaveHint: string | null = null;
  if (draftAutosave.isAutoSavingDraft) {
    autosaveHint = 'Автосохранение...';
  } else if (draftAutosave.lastAutoSavedAt) {
    autosaveHint = `Автосохранено в ${draftAutosave.lastAutoSavedAt}`;
  }

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
