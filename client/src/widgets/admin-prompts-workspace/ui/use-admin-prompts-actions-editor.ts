import { toast } from 'sonner';

import { INITIAL_PROMPT } from '../lib/constants';
import { getApiErrorMessage } from '../lib/utils';

import {
  DEFAULT_TEMPERATURE,
  getDefaultModel,
  getPromptModelFilter,
} from './use-admin-prompts-actions.utils';
import { DEFAULT_PROMPT_TITLE } from './use-admin-prompts-editor-state';

import type { UseAdminPromptsActionsParams } from './use-admin-prompts-actions.types';
import type { ModelFilter } from '../model/types';

export function usePromptEditActions({
  prompts,
  structuredOutputModels,
  selectedPromptId,
  defaultModel,
  setSelectedPromptId,
  setPromptTitle,
  setModel,
  setTemperature,
  setPromptTemplate,
  setPromptEditorScrollTop,
  setModelSearch,
  setModelFilter,
  deletePromptMutation,
  promptsQuery,
}: Pick<
  UseAdminPromptsActionsParams,
  | 'prompts'
  | 'structuredOutputModels'
  | 'selectedPromptId'
  | 'defaultModel'
  | 'setSelectedPromptId'
  | 'setPromptTitle'
  | 'setModel'
  | 'setTemperature'
  | 'setPromptTemplate'
  | 'setPromptEditorScrollTop'
  | 'setModelSearch'
  | 'setModelFilter'
  | 'deletePromptMutation'
  | 'promptsQuery'
>) {
  const resolveDefaultModel = () => getDefaultModel(structuredOutputModels, defaultModel);

  const resetPromptEditor = () => {
    setSelectedPromptId(null);
    setPromptTitle(DEFAULT_PROMPT_TITLE);
    setModel(resolveDefaultModel());
    setTemperature(DEFAULT_TEMPERATURE);
    setPromptTemplate(INITIAL_PROMPT);
    setPromptEditorScrollTop(0);
    setModelSearch('');
    setModelFilter('free');
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
    const nextModelFilter: ModelFilter = selectedCatalogModel
      ? getPromptModelFilter(selectedCatalogModel)
      : 'all';

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

  return {
    resetPromptEditor,
    handleCreateNewPrompt,
    handleSelectPrompt,
    handleDeletePrompt,
  };
}
