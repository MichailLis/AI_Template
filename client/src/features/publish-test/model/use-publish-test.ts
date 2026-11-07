import { toast } from 'sonner';

import { useInvalidateTestTopics } from '@/entities/test-topic';
import { useTestsControllerPublishTopic } from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

/**
 * Публикация черновика теста. Состояние экрана (закрыть подтверждение и редактор, сбросить
 * правки) остаётся за вызывающим и приходит через `onPublished`.
 */
export function usePublishTest() {
  const publishMutation = useTestsControllerPublishTopic();
  const { invalidateTopicData } = useInvalidateTestTopics();

  const publishTest = (topicId: number, onPublished: () => void) => {
    publishMutation.mutate(
      { topicId },
      {
        onSuccess: (result) => {
          toast.success(
            `Опубликована версия v${result.publishedVersionNumber}. Создана новая версия в работе v${result.newDraftVersionNumber}`,
          );
          onPublished();
          invalidateTopicData(topicId);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return { publishTest, isPublishing: publishMutation.isPending };
}
