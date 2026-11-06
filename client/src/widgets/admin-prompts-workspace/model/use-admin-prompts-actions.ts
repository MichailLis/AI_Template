import { useManageAnalysisPrompt } from '@/features/manage-analysis-prompt';

import { usePromptEditActions } from './use-admin-prompts-actions-editor';
import { usePromptSaveAction } from './use-admin-prompts-actions-save';
import { useAdminPromptsVariableActions } from './use-admin-prompts-actions-variable';

import type { UseAdminPromptsActionsParams } from './actions.types';

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
  const { savePrompt, deletePrompt, isSaving, isDeleting } = useManageAnalysisPrompt();
  const variableActions = useAdminPromptsVariableActions({
    variables,
    setVariables,
  });
  const editActions = usePromptEditActions({
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
  });
  const saveAction = usePromptSaveAction({
    selectedPromptId,
    selectedPrompt,
    promptTitle,
    selectedModel,
    selectedModelItem,
    temperature,
    promptTemplate,
    setSelectedPromptId,
    savePrompt,
  });

  return {
    ...variableActions,
    ...editActions,
    ...saveAction,
    isSavingPrompt: isSaving,
    isDeletingPrompt: isDeleting,
  };
}
