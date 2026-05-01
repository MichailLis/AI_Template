import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import { useTestsControllerUpdateTopicDraft } from '@/shared/api/generated/tests/tests';

import { parseApiError } from '../lib/tests-utils';

import type { TestsTopicDetailResponseDtoDraft } from '@/shared/api/model';

interface UseDraftAutosaveParams {
  topicId: number | null;
  draft: TestsTopicDetailResponseDtoDraft | undefined;
  draftForm: {
    title: string;
    description: string;
    analysisPromptVersionId: number | null;
  };
  isDraftDirty: boolean;
  publishIsPending: boolean;
  clearDraftEdits: (draftId: number) => void;
  onAfterSave: () => void;
}

export function useDraftAutosave({
  topicId,
  draft,
  draftForm,
  isDraftDirty,
  publishIsPending,
  clearDraftEdits,
  onAfterSave,
}: UseDraftAutosaveParams) {
  const updateDraftMutation = useTestsControllerUpdateTopicDraft();

  const [isAutoSavingDraft, setIsAutoSavingDraft] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null);

  const resetAutosaveMeta = useCallback(() => {
    setLastAutoSavedAt(null);
    setAutoSaveError(null);
    setIsAutoSavingDraft(false);
  }, []);

  const saveDraft = useCallback(
    (mode: 'manual' | 'auto' = 'manual') => {
      if (!topicId || !draft) {
        return;
      }

      if (mode === 'auto') {
        setIsAutoSavingDraft(true);
        setAutoSaveError(null);
      }

      updateDraftMutation.mutate(
        {
          topicId,
          data: {
            title: draftForm.title.trim() || undefined,
            description: draftForm.description.trim() || null,
            analysisPromptVersionId: draftForm.analysisPromptVersionId,
          },
        },
        {
          onSuccess: () => {
            if (mode === 'manual') {
              toast.success('Изменения сохранены');
            } else {
              setLastAutoSavedAt(
                new Date().toLocaleTimeString('ru-RU', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                }),
              );
            }

            setIsAutoSavingDraft(false);
            setAutoSaveError(null);
            clearDraftEdits(draft.id);
            onAfterSave();
          },
          onError: (error) => {
            const message = parseApiError(error);

            setIsAutoSavingDraft(false);
            if (mode === 'manual') {
              toast.error(message);
            } else {
              setAutoSaveError(message);
            }
          },
        },
      );
    },
    [
      clearDraftEdits,
      draft,
      draftForm.description,
      draftForm.analysisPromptVersionId,
      draftForm.title,
      onAfterSave,
      topicId,
      updateDraftMutation,
    ],
  );

  useEffect(() => {
    if (!isDraftDirty || !draft || !topicId) {
      return;
    }

    if (updateDraftMutation.isPending || publishIsPending) {
      return;
    }

    const timer = window.setTimeout(() => {
      saveDraft('auto');
    }, 1300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [draft, isDraftDirty, publishIsPending, saveDraft, topicId, updateDraftMutation.isPending]);

  return {
    isSavingDraft: updateDraftMutation.isPending,
    isAutoSavingDraft,
    lastAutoSavedAt,
    autoSaveError,
    resetAutosaveMeta,
    saveDraft,
  };
}
