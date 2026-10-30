import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsControllerGetTopicDraftQueryKey,
  getTestsControllerListTopicsQueryKey,
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerImportProfOrientationV3Plus,
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import {
  hasInvalidQuestionReorderPayload,
  isBackendReorderRouteError,
  resolveNextTopicAfterDelete,
} from './admin-tests-workspace-actions.helpers';

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

/** Тост с отменой держится дольше обычного: за это время администратор успевает понять, что импорт лишний. */
const IMPORT_UNDO_TOAST_DURATION_MS = 10_000;

const showError = (error: unknown) => {
  toast.error(parseApiError(error));
};

function useInvalidateTopics() {
  const queryClient = useQueryClient();

  // Активные и архивные списки делят префикс ключа, поэтому обновляются одним вызовом.
  return () => {
    void queryClient.invalidateQueries({ queryKey: getTestsControllerListTopicsQueryKey() });
  };
}

function useCreateTestActions({ topics, draft, dialogs, createForm }: AdminTestsActionsState) {
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const importProfOrientationV3PlusMutation = useTestsControllerImportProfOrientationV3Plus();
  const undoImportMutation = useTestsControllerDeleteTopic();
  const invalidateTopics = useInvalidateTopics();
  const { resetAutosaveMeta } = draft.draftAutosave;

  const createTest = (values: CreateTestValues) => {
    if (!values.title.trim()) {
      toast.error('Укажите название теста');
      return;
    }

    createTopicMutation.mutate(
      {
        data: {
          title: values.title.trim(),
          slug: values.slug.trim() || undefined,
          description: values.description.trim() || null,
        },
      },
      {
        onSuccess: (result) => {
          toast.success('Тест создан');
          createForm.reset();
          resetAutosaveMeta();
          invalidateTopics();
          topics.navigateToTopic(result.topicId);
        },
        onError: showError,
      },
    );
  };

  const handleCreateTestFromAi = (payload: CreateTestsTopicFromAiDto) => {
    createTopicFromAiMutation.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          toast.success('Тест успешно создан с помощью ИИ');
          dialogs.setIsAiGeneratorOpen(false);
          resetAutosaveMeta();
          draft.invalidateTestsData();
          topics.navigateToTopic(result.topicId);
        },
        onError: showError,
      },
    );
  };

  /**
   * Лишний импорт раньше убирался только через архив в четыре шага. Только что импортированный
   * черновик не опубликован и не выдан, поэтому сервер разрешает удалить его сразу.
   */
  const undoImport = (topicId: number) => {
    undoImportMutation.mutate(
      { topicId },
      {
        onSuccess: () => {
          toast.success('Импорт отменен');
          resetAutosaveMeta();
          draft.invalidateTestsData();
          topics.navigateToList();
        },
        onError: showError,
      },
    );
  };

  const handleImportProfOrientationV3Plus = () => {
    importProfOrientationV3PlusMutation.mutate(undefined, {
      onSuccess: (result) => {
        dialogs.setIsImportConfirmOpen(false);
        resetAutosaveMeta();
        draft.invalidateTestsData();
        topics.navigateToTopic(result.topicId);
        toast.success('Методика v3+ импортирована', {
          duration: IMPORT_UNDO_TOAST_DURATION_MS,
          action: { label: 'Отменить', onClick: () => undoImport(result.topicId) },
        });
      },
      onError: showError,
    });
  };

  return {
    createTopicMutation,
    createTopicFromAiMutation,
    importProfOrientationV3PlusMutation,
    handleCreateTest: createForm.handleSubmit(createTest),
    handleCreateTestFromAi,
    handleImportProfOrientationV3Plus,
  };
}

function useTopicSelectionActions({ topics, draft, dialogs }: AdminTestsActionsState) {
  const deleteTopicMutation = useTestsControllerDeleteTopic();
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

    deleteTopicMutation.mutate(
      { topicId: topicIdToDelete },
      {
        onSuccess: () => {
          toast.success('Тест удален');

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
          draft.invalidateTestsData();
        },
        onError: showError,
      },
    );
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
    deleteTopicMutation,
    handleSelectTest,
    handleConfirmTopicSwitch,
    handleConfirmDeleteTopic,
    handleToggleTopicActive,
  };
}

function usePublicationActions({ topics, draft, dialogs, questionEditor }: AdminTestsActionsState) {
  const queryClient = useQueryClient();
  const publishMutation = useTestsControllerPublishTopic();
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const topicId = topics.effectiveSelectedTopicId;

  const handleConfirmPublish = () => {
    if (!topicId) {
      dialogs.setIsPublishConfirmOpen(false);
      return;
    }

    publishMutation.mutate(
      { topicId },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создана новая версия в работе v${result.newDraftVersionNumber}`,
          );
          dialogs.setIsPublishConfirmOpen(false);
          questionEditor.closeQuestionModalDirect();
          if (draft.draft) {
            draft.clearDraftEdits(draft.draft.id);
          }
          draft.draftAutosave.resetAutosaveMeta();
          draft.invalidateTestsData();
        },
        onError: showError,
      },
    );
  };

  const handleReorderQuestions = (questionIds: number[]) => {
    if (!topicId || !draft.detail || reorderQuestionsMutation.isPending) {
      return;
    }

    const currentIds = draft.detail.draft.questions.map((question) => question.id);
    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    if (hasInvalidQuestionReorderPayload(currentIds, questionIds)) {
      toast.error('Не удалось изменить порядок: список вопросов устарел. Обновите страницу теста.');
      void queryClient.invalidateQueries({
        queryKey: getTestsControllerGetTopicDraftQueryKey(topicId),
      });
      return;
    }

    reorderQuestionsMutation.mutate(
      { topicId, data: { questionIds } },
      {
        onSuccess: () => {
          toast.success('Порядок вопросов обновлен');
          draft.invalidateTestsData();
        },
        onError: (error) => {
          const message = parseApiError(error);
          toast.error(
            isBackendReorderRouteError(message)
              ? 'Ошибка маршрута reorder на backend. Перезапустите сервер и обновите страницу.'
              : `Не удалось изменить порядок: ${message}`,
          );
          draft.invalidateTestsData();
        },
      },
    );
  };

  return {
    publishMutation,
    reorderQuestionsMutation,
    handleConfirmPublish,
    handleReorderQuestions,
  };
}

function useArchiveActions({ topics, dialogs }: AdminTestsActionsState) {
  const archiveTopicMutation = useTestsControllerArchiveTopic();
  const restoreTopicMutation = useTestsControllerRestoreTopic();
  const invalidateTopics = useInvalidateTopics();

  const handleConfirmArchiveTopic = () => {
    const topic = dialogs.pendingArchiveTopic;
    if (!topic) {
      return;
    }

    archiveTopicMutation.mutate(
      { topicId: topic.id },
      {
        onSuccess: () => {
          toast.success('Тест заархивирован');
          dialogs.setPendingArchiveTopic(null);
          topics.setListMode('archived');
          invalidateTopics();
        },
        onError: showError,
      },
    );
  };

  const handleConfirmRestoreTopic = () => {
    const topic = dialogs.pendingRestoreTopic;
    if (!topic) {
      return;
    }

    restoreTopicMutation.mutate(
      { topicId: topic.id },
      {
        onSuccess: () => {
          toast.success('Тест восстановлен');
          dialogs.setPendingRestoreTopic(null);
          topics.setListMode('active');
          invalidateTopics();
        },
        onError: showError,
      },
    );
  };

  return {
    archiveTopicMutation,
    restoreTopicMutation,
    handleConfirmArchiveTopic,
    handleConfirmRestoreTopic,
  };
}

/** Mutations of the tests workspace, called directly with the workspace state they change. */
export function useAdminTestsActions(state: AdminTestsActionsState) {
  const createActions = useCreateTestActions(state);
  const selectionActions = useTopicSelectionActions(state);
  const publicationActions = usePublicationActions(state);
  const archiveActions = useArchiveActions(state);

  return { ...createActions, ...selectionActions, ...publicationActions, ...archiveActions };
}
