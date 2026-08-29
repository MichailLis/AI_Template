import { PromptEditorCard } from './prompt-editor-card';
import { PromptLibraryCard } from './prompt-library-card';
import { SimulationOutputCard } from './simulation-output-card';

import type { AdminPromptsWorkspaceState } from './use-admin-prompts-workspace-state';

interface AdminPromptsWorkspaceContentProps {
  workspace: AdminPromptsWorkspaceState;
}

export function AdminPromptsWorkspaceContent({ workspace }: AdminPromptsWorkspaceContentProps) {
  const isSavingPromptVersion =
    workspace.createPromptMutation.isPending ||
    workspace.updatePromptMutation.isPending ||
    workspace.publishVersionMutation.isPending;
  const canRun =
    !!workspace.selectedModel &&
    workspace.selectedModelItem?.supportsStructuredOutputs === true &&
    workspace.selectedQuestionIds.length > 0 &&
    workspace.filteredModels.length > 0 &&
    workspace.duplicateVariableData.duplicateKeys.length === 0;

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_3fr]">
      <div className="xl:col-span-2">
        <PromptLibraryCard
          prompts={workspace.prompts}
          selectedPromptId={workspace.selectedPromptId}
          isLoading={workspace.promptsQuery.isLoading}
          isDeleting={workspace.deletePromptMutation.isPending}
          onCreateNewPrompt={workspace.handleCreateNewPrompt}
          onSelectPrompt={workspace.handleSelectPrompt}
          onDeletePrompt={workspace.handleDeletePrompt}
        />
      </div>

      <PromptEditorCard
        modelSearch={workspace.modelSearch}
        onModelSearchChange={workspace.setModelSearch}
        modelFilter={workspace.modelFilter}
        onModelFilterChange={workspace.setModelFilter}
        filteredModels={workspace.filteredModels}
        allModelsCount={workspace.allModels.length}
        selectedModel={workspace.selectedModel}
        onModelChange={workspace.setModel}
        selectedModelItem={workspace.selectedModelItem}
        temperature={workspace.temperature}
        onTemperatureChange={workspace.setTemperature}
        systemRole={workspace.systemRole}
        onSystemRoleChange={workspace.setSystemRole}
        maxTokens={workspace.maxTokens}
        onMaxTokensChange={workspace.setMaxTokens}
        responseFormat={workspace.responseFormat}
        onResponseFormatChange={workspace.setResponseFormat}
        promptTemplate={workspace.promptTemplate}
        onPromptTemplateChange={workspace.setPromptTemplate}
        promptLineCount={workspace.promptLineCount}
        promptEditorScrollTop={workspace.promptEditorScrollTop}
        onPromptEditorScrollTopChange={workspace.setPromptEditorScrollTop}
        variables={workspace.variables}
        duplicateVariableData={workspace.duplicateVariableData}
        onVariableChange={workspace.updateVariable}
        onAddVariable={workspace.addVariable}
        onRemoveVariable={workspace.removeVariable}
      />

      <SimulationOutputCard
        runs={workspace.runs}
        testQuestionGroups={workspace.testQuestionGroups}
        selectedTest={workspace.selectedTest}
        selectedTestId={workspace.selectedTestId}
        selectedQuestionIds={workspace.selectedQuestionIds}
        promptTitle={workspace.promptTitle}
        selectedPromptId={workspace.selectedPromptId}
        selectedPromptVersionNumber={workspace.selectedPromptVersionNumber}
        isLoadingQuestions={workspace.testQuestionsQuery.isLoading}
        isSavingPromptVersion={isSavingPromptVersion}
        showMetrics={workspace.showMetrics}
        onShowMetricsChange={workspace.setShowMetrics}
        diffView={workspace.diffView}
        onDiffViewChange={workspace.setDiffView}
        onClearLogs={() => workspace.setRuns([])}
        detectedVariablesCount={workspace.detectedVariablesCount}
        onCopyRunJson={workspace.copyRunJson}
        canRun={canRun}
        isGenerating={workspace.simulateMutation.isPending}
        onPromptTitleChange={workspace.setPromptTitle}
        onSelectedTestChange={workspace.setSelectedTestId}
        onRunSimulation={workspace.handleGenerate}
        onSavePromptVersion={workspace.handleSavePromptVersion}
      />
    </div>
  );
}
