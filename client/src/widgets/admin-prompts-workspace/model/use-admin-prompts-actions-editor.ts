import { toast } from 'sonner';

import { DEFAULT_PROMPT_TITLE, INITIAL_PROMPT } from '../lib/constants';
import { DEFAULT_TEMPERATURE, getDefaultModel, getPromptModelFilter } from '../lib/prompt-defaults';

import type { UseAdminPromptsActionsParams } from './actions.types';
import type { ModelFilter } from './types';
import type { useManageAnalysisPrompt } from '@/features/manage-analysis-prompt';

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
  deletePrompt,
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
> &
  Pick<ReturnType<typeof useManageAnalysisPrompt>, 'deletePrompt'>) {
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
    deletePrompt(promptId, {
      onDeleted: () => {
        if (selectedPromptId === promptId) {
          resetPromptEditor();
        }
      },
    });
  };

  return {
    resetPromptEditor,
    handleCreateNewPrompt,
    handleSelectPrompt,
    handleDeletePrompt,
  };
}
