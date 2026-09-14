import { toast } from 'sonner';

import { parseApiError } from '@/shared/lib/api-error';

import type { TestTopicListItem } from '@/features/tests';

interface ToggleTopicActiveDeps {
  selectedTopic: TestTopicListItem | null;
  setPendingArchiveTopic: (value: TestTopicListItem | null) => void;
  setPendingRestoreTopic: (value: TestTopicListItem | null) => void;
}

/**
 * Переключатель «Активен для студентов» закрывает доступ по публичным ссылкам теста, поэтому он
 * не мутирует сразу, а открывает то же подтверждение, что и архивация из списка тестов.
 */
export const createHandleToggleTopicActive = ({
  selectedTopic,
  setPendingArchiveTopic,
  setPendingRestoreTopic,
}: ToggleTopicActiveDeps) => {
  return (nextActive: boolean) => {
    if (!selectedTopic) {
      return;
    }

    if (nextActive) {
      setPendingRestoreTopic(selectedTopic);
      return;
    }

    setPendingArchiveTopic(selectedTopic);
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
