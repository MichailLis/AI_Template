import { toast } from 'sonner';

import { useInvalidateTestTopics } from '@/entities/test-topic';
import { useTestsControllerReorderQuestions } from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import {
  hasInvalidQuestionReorderPayload,
  isBackendReorderRouteError,
} from '../lib/question-reorder';

/** Переупорядочивание вопросов черновика: проверяет порядок, отправляет его и обновляет списки и черновик. */
export function useReorderQuestions() {
  const reorderQuestionsMutation = useTestsControllerReorderQuestions();
  const { invalidateTopicData, invalidateTopicDraft } = useInvalidateTestTopics();

  const reorderQuestions = (topicId: number, currentIds: number[], questionIds: number[]) => {
    if (reorderQuestionsMutation.isPending) {
      return;
    }

    if (JSON.stringify(currentIds) === JSON.stringify(questionIds)) {
      return;
    }

    if (hasInvalidQuestionReorderPayload(currentIds, questionIds)) {
      toast.error('Не удалось изменить порядок: список вопросов устарел. Обновите страницу теста.');
      invalidateTopicDraft(topicId);
      return;
    }

    reorderQuestionsMutation.mutate(
      { topicId, data: { questionIds } },
      {
        onSuccess: () => {
          toast.success('Порядок вопросов обновлен');
          invalidateTopicData(topicId);
        },
        onError: (error) => {
          const message = parseApiError(error);
          toast.error(
            isBackendReorderRouteError(message)
              ? 'Ошибка маршрута reorder на backend. Перезапустите сервер и обновите страницу.'
              : `Не удалось изменить порядок: ${message}`,
          );
          invalidateTopicData(topicId);
        },
      },
    );
  };

  return { reorderQuestions, isReorderingQuestions: reorderQuestionsMutation.isPending };
}
