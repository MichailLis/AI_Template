import { toast } from 'sonner';

import { parseApiError } from '@/shared/lib/api-error';

import type { TestTopicListItem } from '@/features/tests';

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
