import { useIsMutating, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { hasDraftEdits, useDraftAutosave } from '@/features/tests';
import {
  getTestsControllerGetTopicDraftQueryKey,
  getTestsControllerListTopicsQueryKey,
  getTestsControllerPublishTopicMutationKey,
  useTestsControllerGetTopicDraft,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

export function useAdminTestsDraft(effectiveSelectedTopicId: number | null) {
  const queryClient = useQueryClient();
  // Автосохранение ждет публикацию, которую запускает хук действий, созданный позже этого.
  const publishIsPending =
    useIsMutating({ mutationKey: getTestsControllerPublishTopicMutationKey() }) > 0;
  const [draftEdits, setDraftEdits] = useState<
    Record<number, { title: string; description: string; analysisPromptVersionId: number | null }>
  >({});

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId ?? 0, {
    query: {
      enabled: Boolean(effectiveSelectedTopicId),
    },
  });

  const detail = detailQuery.data;
  const draft = detail?.draft;
  const detailErrorMessage = detailQuery.isError ? parseApiError(detailQuery.error) : null;

  const draftForm = useMemo(() => {
    if (!draft) {
      return { id: 0, title: '', description: '', analysisPromptVersionId: null };
    }

    const edited = draftEdits[draft.id];
    return {
      id: draft.id,
      title: edited?.title ?? draft.title,
      description: edited?.description ?? draft.description ?? '',
      analysisPromptVersionId:
        edited?.analysisPromptVersionId ?? draft.analysisPromptVersion?.id ?? null,
    };
  }, [draft, draftEdits]);

  const clearDraftEdits = useCallback((draftId: number) => {
    setDraftEdits((previous) => {
      const next = { ...previous };
      delete next[draftId];
      return next;
    });
  }, []);

  const isDraftDirty = draft
    ? hasDraftEdits(
        draft,
        draftForm.title,
        draftForm.description,
        draftForm.analysisPromptVersionId,
      )
    : false;
  const canPublish = Boolean(detail && !isDraftDirty && detail.draft.questions.length > 0);

  /** Списки тестов (активные и архив — один префикс ключа) и черновик выбранного теста. */
  const invalidateTestsData = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: getTestsControllerListTopicsQueryKey() });
    void queryClient.invalidateQueries({
      queryKey: getTestsControllerGetTopicDraftQueryKey(effectiveSelectedTopicId ?? 0),
    });
  }, [effectiveSelectedTopicId, queryClient]);

  const draftAutosave = useDraftAutosave({
    topicId: effectiveSelectedTopicId,
    draft,
    draftForm,
    isDraftDirty,
    publishIsPending,
    clearDraftEdits,
    onAfterSave: invalidateTestsData,
  });

  const discardCurrentDraftEditsAndResetAutosave = useCallback(() => {
    if (draft) {
      clearDraftEdits(draft.id);
    }

    draftAutosave.resetAutosaveMeta();
  }, [clearDraftEdits, draft, draftAutosave]);

  const updateCurrentDraftEdits = (
    patch: Partial<{ title: string; description: string; analysisPromptVersionId: number | null }>,
  ) => {
    if (!draft) {
      return;
    }

    const hasAnalysisPromptVersionPatch = Object.prototype.hasOwnProperty.call(
      patch,
      'analysisPromptVersionId',
    );

    setDraftEdits((previous) => ({
      ...previous,
      [draft.id]: {
        title: patch.title ?? previous[draft.id]?.title ?? draft.title,
        description:
          patch.description ?? previous[draft.id]?.description ?? draft.description ?? '',
        analysisPromptVersionId: hasAnalysisPromptVersionPatch
          ? (patch.analysisPromptVersionId ?? null)
          : (previous[draft.id]?.analysisPromptVersionId ??
            draft.analysisPromptVersion?.id ??
            null),
      },
    }));
  };

  return {
    detailQuery,
    detail,
    draft,
    detailErrorMessage,
    draftForm,
    isDraftDirty,
    canPublish,
    draftAutosave,
    clearDraftEdits,
    invalidateTestsData,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
  };
}
