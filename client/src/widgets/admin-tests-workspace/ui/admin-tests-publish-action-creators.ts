import { toast } from 'sonner';

import { parseApiError } from '@/shared/lib/api-error';

import {
  hasInvalidQuestionReorderPayload,
  isBackendReorderRouteError,
} from './admin-tests-workspace-actions.helpers';

import type { useDraftAutosave, useQuestionEditor } from '@/features/tests';
import type {
  useTestsControllerPublishTopic,
  useTestsControllerReorderQuestions,
} from '@/shared/api/generated/tests/tests';

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
