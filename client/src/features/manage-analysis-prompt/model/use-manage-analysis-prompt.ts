import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getAnalysisPromptsControllerListPromptsQueryKey,
  useAnalysisPromptsControllerCreatePrompt,
  useAnalysisPromptsControllerDeletePrompt,
  useAnalysisPromptsControllerPublishVersion,
  useAnalysisPromptsControllerUpdatePrompt,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';

import { getPromptSaveError, preparePromptPayload } from '../lib/prompt-save';

import type { AnalysisPromptListResponseDtoPromptsItem } from '@/shared/api/model';

export interface SavePromptInput {
  selectedPromptId: number | null;
  selectedPrompt: AnalysisPromptListResponseDtoPromptsItem | null;
  promptTitle: string;
  selectedModel: string;
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null;
  temperature: string;
  promptTemplate: string;
  /** Вызывается сразу после создания/обновления, до публикации версии. */
  onSaved: (promptId: number) => void;
}

const showRequestError = (error: unknown) => {
  toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
};

/** Сценарии изменения промптов анализа: сохранить (создать/обновить + опубликовать версию) и удалить. */
export function useManageAnalysisPrompt() {
  const queryClient = useQueryClient();
  const createPromptMutation = useAnalysisPromptsControllerCreatePrompt();
  const updatePromptMutation = useAnalysisPromptsControllerUpdatePrompt();
  const deletePromptMutation = useAnalysisPromptsControllerDeletePrompt();
  const publishVersionMutation = useAnalysisPromptsControllerPublishVersion();

  const invalidatePrompts = () =>
    queryClient.invalidateQueries({ queryKey: getAnalysisPromptsControllerListPromptsQueryKey() });

  const publishDraftVersion = (draftVersionId: number | undefined, successMessage: string) => {
    if (!draftVersionId) {
      void invalidatePrompts();
      toast.success(successMessage);
      return;
    }

    publishVersionMutation.mutate(
      { versionId: draftVersionId },
      {
        onSuccess: () => {
          void invalidatePrompts();
          toast.success(successMessage);
        },
        onError: showRequestError,
      },
    );
  };

  const savePrompt = ({
    selectedPromptId,
    selectedPrompt,
    promptTitle,
    selectedModel,
    selectedModelItem,
    temperature,
    promptTemplate,
    onSaved,
  }: SavePromptInput) => {
    const parsedTemperature = Number(temperature);
    const preparedPrompt = promptTemplate.trim();
    const title = promptTitle.trim();
    const validationError = getPromptSaveError(
      title,
      selectedModel,
      selectedModelItem,
      preparedPrompt,
      parsedTemperature,
    );

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payload = preparePromptPayload({
      selectedPrompt,
      title,
      selectedModel,
      parsedTemperature,
      preparedPrompt,
    });

    if (!selectedPromptId) {
      createPromptMutation.mutate(
        { data: payload },
        {
          onSuccess: (data) => {
            onSaved(data.prompt.id);
            publishDraftVersion(data.prompt.versions[0]?.id, 'Промпт опубликован');
          },
          onError: showRequestError,
        },
      );
      return;
    }

    updatePromptMutation.mutate(
      { promptId: selectedPromptId, data: payload },
      {
        onSuccess: (data) => {
          onSaved(data.prompt.id);
          publishDraftVersion(data.prompt.versions[0]?.id, 'Новая версия промпта опубликована');
        },
        onError: showRequestError,
      },
    );
  };

  const deletePrompt = (promptId: number, { onDeleted }: { onDeleted: () => void }) => {
    deletePromptMutation.mutate(
      { promptId },
      {
        onSuccess: () => {
          void invalidatePrompts();
          onDeleted();
          toast.success('Промпт удален');
        },
        onError: showRequestError,
      },
    );
  };

  return {
    savePrompt,
    deletePrompt,
    isSaving:
      createPromptMutation.isPending ||
      updatePromptMutation.isPending ||
      publishVersionMutation.isPending,
    isDeleting: deletePromptMutation.isPending,
  };
}
