import { useCallback, useMemo, useState } from 'react';

import { hasDraftEdits, useDraftAutosave } from '@/features/tests';
import { useTestsControllerGetTopicDraft } from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

interface RefetchableQuery {
  refetch: () => unknown;
}

interface UseAdminTestsDraftParams {
  effectiveSelectedTopicId: number | null;
  activeTopicsQuery: RefetchableQuery;
  archivedTopicsQuery: RefetchableQuery;
  publishIsPending: boolean;
}

export function useAdminTestsDraft({
  effectiveSelectedTopicId,
  activeTopicsQuery,
  archivedTopicsQuery,
  publishIsPending,
}: UseAdminTestsDraftParams) {
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

  const refetchTestsData = useCallback(() => {
    void Promise.all([
      activeTopicsQuery.refetch(),
      archivedTopicsQuery.refetch(),
      detailQuery.refetch(),
    ]);
  }, [activeTopicsQuery, archivedTopicsQuery, detailQuery]);

  const draftAutosave = useDraftAutosave({
    topicId: effectiveSelectedTopicId,
    draft,
    draftForm,
    isDraftDirty,
    publishIsPending,
    clearDraftEdits,
    onAfterSave: refetchTestsData,
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
    refetchTestsData,
    updateCurrentDraftEdits,
    discardCurrentDraftEditsAndResetAutosave,
  };
}
