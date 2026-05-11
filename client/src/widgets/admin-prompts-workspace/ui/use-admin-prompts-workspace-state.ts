import { useAdminControllerGetPromptModels } from '@/shared/api/generated/admin/admin';
import {
  useAnalysisPromptsControllerCreatePrompt,
  useAnalysisPromptsControllerDeletePrompt,
  useAnalysisPromptsControllerListPrompts,
  useAnalysisPromptsControllerListTestQuestions,
  useAnalysisPromptsControllerPublishVersion,
  useAnalysisPromptsControllerSimulatePrompt,
  useAnalysisPromptsControllerUpdatePrompt,
} from '@/shared/api/generated/admin/admin';

import { useAdminPromptsActions } from './use-admin-prompts-actions';
import { useAdminPromptsEditorState } from './use-admin-prompts-editor-state';
import { useAdminPromptsSimulation } from './use-admin-prompts-simulation';
import {
  usePromptCatalog,
  usePromptWorkspaceDerivedState,
} from './use-admin-prompts-workspace-selectors';

export function useAdminPromptsWorkspaceData() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const promptsQuery = useAnalysisPromptsControllerListPrompts();
  const testQuestionsQuery = useAnalysisPromptsControllerListTestQuestions();
  const createPromptMutation = useAnalysisPromptsControllerCreatePrompt();
  const updatePromptMutation = useAnalysisPromptsControllerUpdatePrompt();
  const deletePromptMutation = useAnalysisPromptsControllerDeletePrompt();
  const publishVersionMutation = useAnalysisPromptsControllerPublishVersion();
  const simulateMutation = useAnalysisPromptsControllerSimulatePrompt();
  const editorState = useAdminPromptsEditorState();
  const catalog = usePromptCatalog({
    model: editorState.model,
    modelSearch: editorState.modelSearch,
    modelFilter: editorState.modelFilter,
    modelsQuery,
  });

  const derived = usePromptWorkspaceDerivedState({
    promptsQuery,
    testQuestionsQuery,
    selectedPromptId: editorState.selectedPromptId,
    selectedTestId: editorState.selectedTestId,
    promptTemplate: editorState.promptTemplate,
    variables: editorState.variables,
  });
  const simulation = useAdminPromptsSimulation({
    selectedModel: catalog.selectedModel,
    selectedModelItem: catalog.selectedModelItem,
    duplicateVariableData: derived.duplicateVariableData,
    temperature: editorState.temperature,
    renderedPrompt: derived.renderedPrompt,
    selectedTest: derived.selectedTest,
    selectedQuestionIds: derived.selectedQuestionIds,
    responseFormat: editorState.responseFormat,
    simulateMutation,
  });

  const actions = useAdminPromptsActions({
    prompts: derived.prompts,
    structuredOutputModels: catalog.structuredOutputModels,
    defaultModel: modelsQuery.data?.defaultModel,
    selectedPromptId: editorState.selectedPromptId,
    selectedPrompt: derived.selectedPrompt,
    promptTitle: editorState.promptTitle,
    selectedModel: catalog.selectedModel,
    selectedModelItem: catalog.selectedModelItem,
    temperature: editorState.temperature,
    promptTemplate: editorState.promptTemplate,
    variables: editorState.variables,
    promptsQuery,
    createPromptMutation,
    updatePromptMutation,
    deletePromptMutation,
    publishVersionMutation,
    setSelectedPromptId: editorState.setSelectedPromptId,
    setPromptTitle: editorState.setPromptTitle,
    setModel: editorState.setModel,
    setTemperature: editorState.setTemperature,
    setPromptTemplate: editorState.setPromptTemplate,
    setPromptEditorScrollTop: editorState.setPromptEditorScrollTop,
    setModelSearch: editorState.setModelSearch,
    setModelFilter: editorState.setModelFilter,
    setVariables: editorState.setVariables,
  });

  return {
    modelsQuery,
    promptsQuery,
    testQuestionsQuery,
    createPromptMutation,
    updatePromptMutation,
    deletePromptMutation,
    publishVersionMutation,
    simulateMutation,
    editorState: {
      ...editorState,
      selectedModelItem: catalog.selectedModelItem,
    },
    derived,
    actions,
    catalog: {
      structuredOutputModels: catalog.structuredOutputModels,
      allModels: catalog.allModels,
      filteredModels: catalog.filteredModels,
      selectedModel: catalog.selectedModel,
      selectedModelItem: catalog.selectedModelItem,
    },
    simulation,
  };
}

export function useAdminPromptsWorkspaceState() {
  const state = useAdminPromptsWorkspaceData();
  const { editorState, derived, catalog, simulation, actions, ...base } = state;

  return {
    ...base,
    ...editorState,
    ...derived,
    allModels: catalog.structuredOutputModels,
    filteredModels: catalog.filteredModels,
    selectedModel: catalog.selectedModel,
    selectedModelItem: catalog.selectedModelItem,
    runs: simulation.runs,
    setRuns: simulation.setRuns,
    copyRunJson: simulation.copyRunJson,
    handleGenerate: simulation.handleGenerate,
    selectedTestId: derived.selectedTest?.id ?? null,
    testQuestionGroups: derived.testQuestionGroups,
    ...actions,
  };
}
