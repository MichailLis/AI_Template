import { useQueryClient } from '@tanstack/react-query';

import {
  getTestsControllerGetTopicDraftQueryKey,
  getTestsControllerListTopicsQueryKey,
} from '@/shared/api/generated/tests/tests';

/** Ключи чтений тем теста: списки (активные и архив делят префикс) и черновик одной темы. */
export function useInvalidateTestTopics() {
  const queryClient = useQueryClient();

  const invalidateTopicLists = () => {
    void queryClient.invalidateQueries({ queryKey: getTestsControllerListTopicsQueryKey() });
  };

  const invalidateTopicDraft = (topicId: number) => {
    void queryClient.invalidateQueries({
      queryKey: getTestsControllerGetTopicDraftQueryKey(topicId),
    });
  };

  const invalidateTopicData = (topicId: number) => {
    invalidateTopicLists();
    invalidateTopicDraft(topicId);
  };

  return { invalidateTopicLists, invalidateTopicDraft, invalidateTopicData };
}
