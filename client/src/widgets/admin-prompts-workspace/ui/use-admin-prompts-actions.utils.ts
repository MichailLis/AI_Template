import { toast } from 'sonner';

import { getApiErrorMessage } from '../lib/utils';

import type { UseAdminPromptsActionsParams } from './use-admin-prompts-actions.types';
import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

export const DEFAULT_TEMPERATURE = '0.7';

export type PromptPayload = {
  title: string;
  description: string;
  model: string;
  temperature: number;
  prompt: string;
};

export const getDefaultModel = (
  structuredOutputModels: AdminPromptModelsResponseDtoModelsItem[],
  defaultModel?: string,
) =>
  defaultModel ??
  structuredOutputModels.find((item) => item.isFree)?.id ??
  structuredOutputModels[0]?.id ??
  '';

export const getPromptModelFilter = (
  selectedCatalogModel: AdminPromptModelsResponseDtoModelsItem | null,
) => (selectedCatalogModel?.isFree ? 'free' : 'paid');

export const preparePromptPayload = (params: {
  selectedPrompt: UseAdminPromptsActionsParams['selectedPrompt'];
  title: string;
  selectedModel: string;
  parsedTemperature: number;
  preparedPrompt: string;
  defaultDescription: string;
}) => ({
  title: params.title,
  description: params.selectedPrompt?.description ?? params.defaultDescription,
  model: params.selectedModel,
  temperature: params.parsedTemperature,
  prompt: params.preparedPrompt,
});

export const getPromptSaveError = (
  promptTitle: string,
  selectedModel: string,
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null,
  preparedPrompt: string,
  temperature: number,
) => {
  if (!promptTitle) {
    return 'Укажите название промпта';
  }

  if (!selectedModel) {
    return 'Выберите модель';
  }

  if (selectedModelItem?.supportsStructuredOutputs !== true) {
    return 'Выберите модель OpenRouter со structured outputs';
  }

  if (!preparedPrompt) {
    return 'Шаблон промпта пуст';
  }

  if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
    return 'Temperature must be between 0 and 2';
  }

  return null;
};

export const publishDraftPromptVersion = (
  draftVersionId: number | undefined,
  successMessage: string,
  promptsQuery: UseAdminPromptsActionsParams['promptsQuery'],
  publishVersionMutation: UseAdminPromptsActionsParams['publishVersionMutation'],
) => {
  if (!draftVersionId) {
    void promptsQuery.refetch();
    toast.success(successMessage);
    return;
  }

  publishVersionMutation.mutate(
    { versionId: draftVersionId },
    {
      onSuccess: () => {
        void promptsQuery.refetch();
        toast.success(successMessage);
      },
      onError: (error: unknown) => {
        toast.error(getApiErrorMessage(error));
      },
    },
  );
};
