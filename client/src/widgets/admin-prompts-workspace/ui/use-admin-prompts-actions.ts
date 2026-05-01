import { toast } from 'sonner';

import { INITIAL_PROMPT } from '../lib/constants';
import { createVariableId, getApiErrorMessage } from '../lib/utils';

import { DEFAULT_PROMPT_DESCRIPTION, DEFAULT_PROMPT_TITLE } from './use-admin-prompts-editor-state';

import type { ModelFilter, PromptVariable } from '../model/types';
import type {
  useAnalysisPromptsControllerCreatePrompt,
  useAnalysisPromptsControllerDeletePrompt,
  useAnalysisPromptsControllerListPrompts,
  useAnalysisPromptsControllerPublishVersion,
  useAnalysisPromptsControllerUpdatePrompt,
} from '@/shared/api/generated/admin/admin';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  AnalysisPromptListResponseDtoPromptsItem,
} from '@/shared/api/model';
import type { Dispatch, SetStateAction } from 'react';

interface UseAdminPromptsActionsParams {
  prompts: AnalysisPromptListResponseDtoPromptsItem[];
  structuredOutputModels: AdminPromptModelsResponseDtoModelsItem[];
  defaultModel?: string;
  selectedPromptId: number | null;
  selectedPrompt: AnalysisPromptListResponseDtoPromptsItem | null;
  promptTitle: string;
  selectedModel: string;
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null;
  temperature: string;
  promptTemplate: string;
  variables: PromptVariable[];
  promptsQuery: Pick<ReturnType<typeof useAnalysisPromptsControllerListPrompts>, 'refetch'>;
  createPromptMutation: ReturnType<typeof useAnalysisPromptsControllerCreatePrompt>;
  updatePromptMutation: ReturnType<typeof useAnalysisPromptsControllerUpdatePrompt>;
  deletePromptMutation: ReturnType<typeof useAnalysisPromptsControllerDeletePrompt>;
  publishVersionMutation: ReturnType<typeof useAnalysisPromptsControllerPublishVersion>;
  setSelectedPromptId: Dispatch<SetStateAction<number | null>>;
  setPromptTitle: Dispatch<SetStateAction<string>>;
  setModel: Dispatch<SetStateAction<string>>;
  setTemperature: Dispatch<SetStateAction<string>>;
  setPromptTemplate: Dispatch<SetStateAction<string>>;
  setPromptEditorScrollTop: Dispatch<SetStateAction<number>>;
  setModelSearch: Dispatch<SetStateAction<string>>;
  setModelFilter: Dispatch<SetStateAction<ModelFilter>>;
  setVariables: Dispatch<SetStateAction<PromptVariable[]>>;
}

export function useAdminPromptsActions({
  prompts,
  structuredOutputModels,
  defaultModel,
  selectedPromptId,
  selectedPrompt,
  promptTitle,
  selectedModel,
  selectedModelItem,
  temperature,
  promptTemplate,
  variables,
  promptsQuery,
  createPromptMutation,
  updatePromptMutation,
  deletePromptMutation,
  publishVersionMutation,
  setSelectedPromptId,
  setPromptTitle,
  setModel,
  setTemperature,
  setPromptTemplate,
  setPromptEditorScrollTop,
  setModelSearch,
  setModelFilter,
  setVariables,
}: UseAdminPromptsActionsParams) {
  const getDefaultModel = () =>
    defaultModel ??
    structuredOutputModels.find((item) => item.isFree)?.id ??
    structuredOutputModels[0]?.id ??
    '';

  const resetPromptEditor = () => {
    setSelectedPromptId(null);
    setPromptTitle(DEFAULT_PROMPT_TITLE);
    setModel(getDefaultModel());
    setTemperature('0.7');
    setPromptTemplate(INITIAL_PROMPT);
    setPromptEditorScrollTop(0);
    setModelSearch('');
    setModelFilter('free');
  };

  const updateVariable = (variableId: string, field: 'key' | 'value', value: string) => {
    setVariables((prev) =>
      prev.map((item) => {
        if (item.id !== variableId) {
          return item;
        }

        return field === 'key' ? { ...item, key: value } : { ...item, value };
      }),
    );
  };

  const addVariable = () => {
    const nextIndex = variables.length + 1;

    setVariables((prev) => [
      ...prev,
      {
        id: createVariableId(),
        key: `variable_${nextIndex}`,
        value: '',
      },
    ]);
  };

  const removeVariable = (variableId: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== variableId));
  };

  const handleCreateNewPrompt = () => {
    resetPromptEditor();
    toast.success('Открыт новый промпт');
  };

  const handleSelectPrompt = (promptId: number) => {
    const prompt = prompts.find((item) => item.id === promptId);
    const latestVersion = prompt?.versions[0];

    if (!prompt || !latestVersion) {
      toast.error('Промпт не найден');
      return;
    }

    const selectedCatalogModel = structuredOutputModels.find(
      (item) => item.id === latestVersion.model,
    );
    let nextModelFilter: ModelFilter = 'all';

    if (selectedCatalogModel) {
      nextModelFilter = selectedCatalogModel.isFree ? 'free' : 'paid';
    }

    setSelectedPromptId(prompt.id);
    setPromptTitle(prompt.title);
    setModel(latestVersion.model);
    setTemperature(String(latestVersion.temperature));
    setPromptTemplate(latestVersion.prompt);
    setPromptEditorScrollTop(0);
    setModelSearch('');
    setModelFilter(nextModelFilter);
    toast.success('Промпт загружен в редактор');
  };

  const publishDraftPromptVersion = (
    draftVersionId: number | undefined,
    successMessage: string,
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

  const handleDeletePrompt = (promptId: number) => {
    deletePromptMutation.mutate(
      { promptId },
      {
        onSuccess: () => {
          void promptsQuery.refetch();

          if (selectedPromptId === promptId) {
            resetPromptEditor();
          }

          toast.success('Промпт удален');
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleSavePromptVersion = () => {
    const parsedTemperature = Number(temperature);
    const preparedPrompt = promptTemplate.trim();
    const title = promptTitle.trim();

    if (!title) {
      toast.error('Укажите название промпта');
      return;
    }

    if (!selectedModel) {
      toast.error('Выберите модель');
      return;
    }

    if (selectedModelItem?.supportsStructuredOutputs !== true) {
      toast.error('Выберите модель OpenRouter со structured outputs');
      return;
    }

    if (!preparedPrompt) {
      toast.error('Шаблон промпта пуст');
      return;
    }

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    const promptPayload = {
      title,
      description: selectedPrompt?.description ?? DEFAULT_PROMPT_DESCRIPTION,
      model: selectedModel,
      temperature: parsedTemperature,
      prompt: preparedPrompt,
    };

    if (selectedPromptId) {
      updatePromptMutation.mutate(
        {
          promptId: selectedPromptId,
          data: promptPayload,
        },
        {
          onSuccess: (data) => {
            setSelectedPromptId(data.prompt.id);
            publishDraftPromptVersion(
              data.prompt.versions[0]?.id,
              'Новая версия промпта опубликована',
            );
          },
          onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error));
          },
        },
      );
      return;
    }

    createPromptMutation.mutate(
      {
        data: promptPayload,
      },
      {
        onSuccess: (data) => {
          setSelectedPromptId(data.prompt.id);
          publishDraftPromptVersion(data.prompt.versions[0]?.id, 'Промпт опубликован');
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  return {
    updateVariable,
    addVariable,
    removeVariable,
    handleCreateNewPrompt,
    handleSelectPrompt,
    handleDeletePrompt,
    handleSavePromptVersion,
  };
}
