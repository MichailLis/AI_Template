import { toast } from 'sonner';

import { DEFAULT_PROMPT_DESCRIPTION } from '../lib/constants';
import { getApiErrorMessage } from '../lib/utils';

import {
  getPromptSaveError,
  preparePromptPayload,
  publishDraftPromptVersion,
} from './use-admin-prompts-actions.utils';

import type { UseAdminPromptsActionsParams } from './use-admin-prompts-actions.types';

export function usePromptSaveAction({
  selectedPromptId,
  selectedPrompt,
  promptTitle,
  selectedModel,
  selectedModelItem,
  temperature,
  promptTemplate,
  setSelectedPromptId,
  createPromptMutation,
  updatePromptMutation,
  promptsQuery,
  publishVersionMutation,
}: Pick<
  UseAdminPromptsActionsParams,
  | 'selectedPromptId'
  | 'selectedPrompt'
  | 'promptTitle'
  | 'selectedModel'
  | 'selectedModelItem'
  | 'temperature'
  | 'promptTemplate'
  | 'setSelectedPromptId'
  | 'createPromptMutation'
  | 'updatePromptMutation'
  | 'promptsQuery'
  | 'publishVersionMutation'
>) {
  const handleSavePromptVersion = () => {
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
      defaultDescription: DEFAULT_PROMPT_DESCRIPTION,
    });

    if (!selectedPromptId) {
      createPromptMutation.mutate(
        { data: payload },
        {
          onSuccess: (data) => {
            setSelectedPromptId(data.prompt.id);
            publishDraftPromptVersion(
              data.prompt.versions[0]?.id,
              'Промпт опубликован',
              promptsQuery,
              publishVersionMutation,
            );
          },
          onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error));
          },
        },
      );
      return;
    }

    updatePromptMutation.mutate(
      { promptId: selectedPromptId, data: payload },
      {
        onSuccess: (data) => {
          setSelectedPromptId(data.prompt.id);
          publishDraftPromptVersion(
            data.prompt.versions[0]?.id,
            'Новая версия промпта опубликована',
            promptsQuery,
            publishVersionMutation,
          );
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return { handleSavePromptVersion };
}
