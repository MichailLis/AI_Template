import { PromptEditorCard } from './prompt-editor-card';
import { PromptLibraryCard } from './prompt-library-card';
import { SimulationOutputCard } from './simulation-output-card';
import { useAdminPromptsWorkspace } from './use-admin-prompts-workspace';

export function AdminPromptsWorkspace() {
  const {
    modelsQuery,
    promptsQuery,
    testQuestionsQuery,
    createPromptMutation,
    updatePromptMutation,
    deletePromptMutation,
    publishVersionMutation,
    simulateMutation,
    selectedPromptId,
    selectedPromptVersionNumber,
    promptTitle,
    temperature,
    responseFormat,
    modelSearch,
    modelFilter,
    systemRole,
    maxTokens,
    promptTemplate,
    promptEditorScrollTop,
    variables,
    showMetrics,
    diffView,
    runs,
    prompts,
    testQuestionGroups,
    selectedTest,
    selectedTestId,
    allModels,
    filteredModels,
    selectedModel,
    selectedModelItem,
    promptLineCount,
    duplicateVariableData,
    detectedVariablesCount,
    selectedQuestionIds,
    setPromptTitle,
    setModel,
    setTemperature,
    setResponseFormat,
    setModelSearch,
    setModelFilter,
    setSystemRole,
    setMaxTokens,
    setPromptTemplate,
    setPromptEditorScrollTop,
    setShowMetrics,
    setDiffView,
    setRuns,
    setSelectedTestId,
    updateVariable,
    addVariable,
    removeVariable,
    copyRunJson,
    handleCreateNewPrompt,
    handleSelectPrompt,
    handleDeletePrompt,
    handleGenerate,
    handleSavePromptVersion,
  } = useAdminPromptsWorkspace();

  if (modelsQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center text-sm text-slate-500">Загрузка каталога моделей...</div>
      </div>
    );
  }

  if (modelsQuery.isError || !modelsQuery.data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-700">Не удалось загрузить модели OpenRouter.</p>
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            onClick={() => modelsQuery.refetch()}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_3fr]">
      <div className="xl:col-span-2">
        <PromptLibraryCard
          prompts={prompts}
          selectedPromptId={selectedPromptId}
          isLoading={promptsQuery.isLoading}
          isDeleting={deletePromptMutation.isPending}
          onCreateNewPrompt={handleCreateNewPrompt}
          onSelectPrompt={handleSelectPrompt}
          onDeletePrompt={handleDeletePrompt}
        />
      </div>

      <PromptEditorCard
        modelSearch={modelSearch}
        onModelSearchChange={setModelSearch}
        modelFilter={modelFilter}
        onModelFilterChange={setModelFilter}
        filteredModels={filteredModels}
        allModelsCount={allModels.length}
        selectedModel={selectedModel}
        onModelChange={setModel}
        selectedModelItem={selectedModelItem}
        temperature={temperature}
        onTemperatureChange={setTemperature}
        systemRole={systemRole}
        onSystemRoleChange={setSystemRole}
        maxTokens={maxTokens}
        onMaxTokensChange={setMaxTokens}
        responseFormat={responseFormat}
        onResponseFormatChange={setResponseFormat}
        promptTemplate={promptTemplate}
        onPromptTemplateChange={setPromptTemplate}
        promptLineCount={promptLineCount}
        promptEditorScrollTop={promptEditorScrollTop}
        onPromptEditorScrollTopChange={setPromptEditorScrollTop}
        variables={variables}
        duplicateVariableData={duplicateVariableData}
        onVariableChange={updateVariable}
        onAddVariable={addVariable}
        onRemoveVariable={removeVariable}
      />

      <SimulationOutputCard
        runs={runs}
        testQuestionGroups={testQuestionGroups}
        selectedTest={selectedTest}
        selectedTestId={selectedTestId}
        selectedQuestionIds={selectedQuestionIds}
        promptTitle={promptTitle}
        selectedPromptId={selectedPromptId}
        selectedPromptVersionNumber={selectedPromptVersionNumber}
        isLoadingQuestions={testQuestionsQuery.isLoading}
        isSavingPromptVersion={
          createPromptMutation.isPending ||
          updatePromptMutation.isPending ||
          publishVersionMutation.isPending
        }
        showMetrics={showMetrics}
        onShowMetricsChange={setShowMetrics}
        diffView={diffView}
        onDiffViewChange={setDiffView}
        onClearLogs={() => setRuns([])}
        detectedVariablesCount={detectedVariablesCount}
        isGenerating={simulateMutation.isPending}
        canRun={
          !!selectedModel &&
          selectedModelItem?.supportsStructuredOutputs === true &&
          selectedQuestionIds.length > 0 &&
          filteredModels.length > 0 &&
          duplicateVariableData.duplicateKeys.length === 0
        }
        onPromptTitleChange={setPromptTitle}
        onSelectedTestChange={setSelectedTestId}
        onRunSimulation={handleGenerate}
        onSavePromptVersion={handleSavePromptVersion}
        onCopyRunJson={copyRunJson}
      />
    </div>
  );
}
