import { PromptEditorCard } from './prompt-editor-card';
import { SimulationOutputCard } from './simulation-output-card';
import { useAdminPromptsWorkspace } from './use-admin-prompts-workspace';

export function AdminPromptsWorkspace() {
  const {
    modelsQuery,
    generateMutation,
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
    allModels,
    filteredModels,
    selectedModel,
    selectedModelItem,
    promptLineCount,
    duplicateVariableData,
    detectedVariablesCount,
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
    updateVariable,
    addVariable,
    removeVariable,
    copyRunJson,
    handleGenerate,
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
        showMetrics={showMetrics}
        onShowMetricsChange={setShowMetrics}
        diffView={diffView}
        onDiffViewChange={setDiffView}
        onClearLogs={() => setRuns([])}
        detectedVariablesCount={detectedVariablesCount}
        isGenerating={generateMutation.isPending}
        canRun={
          !!selectedModel &&
          filteredModels.length > 0 &&
          duplicateVariableData.duplicateKeys.length === 0
        }
        onRunSimulation={handleGenerate}
        onCopyRunJson={copyRunJson}
      />
    </div>
  );
}
