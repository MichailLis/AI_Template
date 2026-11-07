import { toast } from 'sonner';

import { useInvalidateTestTopics } from '@/entities/test-topic';
import {
  useTestsControllerArchiveTopic,
  useTestsControllerCreateTopic,
  useTestsControllerCreateTopicFromAi,
  useTestsControllerDeleteTopic,
  useTestsControllerImportProfOrientationV3Plus,
  useTestsControllerRestoreTopic,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import type { CreateTestsTopicFromAiDto } from '@/shared/api/model';

export interface CreateTopicValues {
  title: string;
  slug: string;
  description: string;
}

/** Тост с отменой держится дольше обычного: за это время администратор успевает понять, что импорт лишний. */
const IMPORT_UNDO_TOAST_DURATION_MS = 10_000;

const showError = (error: unknown) => {
  toast.error(parseApiError(error));
};

/** Импорт методики v3+ и отмена импорта удалением только что созданного черновика. */
function useImportProfOrientation() {
  const importMutation = useTestsControllerImportProfOrientationV3Plus();
  const undoImportMutation = useTestsControllerDeleteTopic();
  const { invalidateTopicLists, invalidateTopicData } = useInvalidateTestTopics();

  /**
   * Лишний импорт раньше убирался только через архив в четыре шага. Только что импортированный
   * черновик не опубликован и не выдан, поэтому сервер разрешает удалить его сразу.
   */
  const undoImport = (topicId: number, onUndone: () => void) => {
    undoImportMutation.mutate(
      { topicId },
      {
        onSuccess: () => {
          toast.success('Импорт отменен');
          invalidateTopicData(topicId);
          onUndone();
        },
        onError: showError,
      },
    );
  };

  const importProfOrientationV3Plus = (callbacks: {
    onImported: (topicId: number) => void;
    onUndone: () => void;
  }) => {
    importMutation.mutate(undefined, {
      onSuccess: (result) => {
        invalidateTopicLists();
        callbacks.onImported(result.topicId);
        toast.success('Методика v3+ импортирована', {
          duration: IMPORT_UNDO_TOAST_DURATION_MS,
          action: {
            label: 'Отменить',
            onClick: () => undoImport(result.topicId, callbacks.onUndone),
          },
        });
      },
      onError: showError,
    });
  };

  return { importProfOrientationV3Plus, isImportingProfOrientation: importMutation.isPending };
}

/**
 * Сценарии над темой теста: создать, создать из ИИ, импортировать методику v3+ (с отменой),
 * удалить, архивировать, восстановить. Каждое обновляет списки тем; выбор темы, закрытие
 * диалогов и сброс правок остаются за вызывающим и приходят колбэками.
 */
export function useManageTestTopic() {
  const createTopicMutation = useTestsControllerCreateTopic();
  const createTopicFromAiMutation = useTestsControllerCreateTopicFromAi();
  const { importProfOrientationV3Plus, isImportingProfOrientation } = useImportProfOrientation();
  const deleteTopicMutation = useTestsControllerDeleteTopic();
  const archiveTopicMutation = useTestsControllerArchiveTopic();
  const restoreTopicMutation = useTestsControllerRestoreTopic();
  const { invalidateTopicLists, invalidateTopicData } = useInvalidateTestTopics();

  const createTopic = (values: CreateTopicValues, onCreated: (topicId: number) => void) => {
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
          invalidateTopicLists();
          onCreated(result.topicId);
        },
        onError: showError,
      },
    );
  };

  const createTopicFromAi = (
    payload: CreateTestsTopicFromAiDto,
    onCreated: (topicId: number) => void,
  ) => {
    createTopicFromAiMutation.mutate(
      { data: payload },
      {
        onSuccess: (result) => {
          toast.success('Тест успешно создан с помощью ИИ');
          invalidateTopicLists();
          onCreated(result.topicId);
        },
        onError: showError,
      },
    );
  };

  const deleteTopic = (topicId: number, onDeleted: () => void) => {
    deleteTopicMutation.mutate(
      { topicId },
      {
        onSuccess: () => {
          toast.success('Тест удален');
          onDeleted();
          invalidateTopicData(topicId);
        },
        onError: showError,
      },
    );
  };

  const archiveTopic = (topicId: number, onArchived: () => void) => {
    archiveTopicMutation.mutate(
      { topicId },
      {
        onSuccess: () => {
          toast.success('Тест заархивирован');
          onArchived();
          invalidateTopicLists();
        },
        onError: showError,
      },
    );
  };

  const restoreTopic = (topicId: number, onRestored: () => void) => {
    restoreTopicMutation.mutate(
      { topicId },
      {
        onSuccess: () => {
          toast.success('Тест восстановлен');
          onRestored();
          invalidateTopicLists();
        },
        onError: showError,
      },
    );
  };

  return {
    createTopic,
    createTopicFromAi,
    importProfOrientationV3Plus,
    deleteTopic,
    archiveTopic,
    restoreTopic,
    isCreatingTopic: createTopicMutation.isPending,
    isCreatingTopicFromAi: createTopicFromAiMutation.isPending,
    isImportingProfOrientation,
    isDeletingTopic: deleteTopicMutation.isPending,
    isArchivingTopic: archiveTopicMutation.isPending,
    isRestoringTopic: restoreTopicMutation.isPending,
  };
}
