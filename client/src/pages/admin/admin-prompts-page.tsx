import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerGeneratePrompt,
  useAdminControllerGetPromptModels,
} from '@/shared/api/generated/admin/admin';

import { INITIAL_PROMPT, INITIAL_RUNS, INITIAL_VARIABLES } from './prompt-studio/constants';
import { PromptEditorCard } from './prompt-studio/prompt-editor-card';
import { SimulationOutputCard } from './prompt-studio/simulation-output-card';
import {
  createVariableId,
  estimateTokens,
  formatNow,
  generateRunId,
  getApiErrorMessage,
  getDuplicateVariableData,
  interpolatePrompt,
} from './prompt-studio/utils';

import type {
  ModelFilter,
  PromptVariable,
  ResponseFormat,
  SimulationRun,
} from './prompt-studio/types';

export default function AdminPromptsPage() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const generateMutation = useAdminControllerGeneratePrompt();

  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('text');
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');
  const [systemRole, setSystemRole] = useState('Career Counselor Expert');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [promptTemplate, setPromptTemplate] = useState(INITIAL_PROMPT);
  const [promptEditorScrollTop, setPromptEditorScrollTop] = useState(0);
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);
  const [showMetrics, setShowMetrics] = useState(true);
  const [diffView, setDiffView] = useState(false);
  const [runs, setRuns] = useState<SimulationRun[]>(INITIAL_RUNS);

  const allModels = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);

  const filteredModels = useMemo(() => {
    const normalizedSearch = modelSearch.trim().toLowerCase();
    const hasFreeModels = allModels.some((item) => item.isFree);
    const effectiveModelFilter = modelFilter === 'free' && !hasFreeModels ? 'all' : modelFilter;

    return allModels.filter((item) => {
      const byType =
        effectiveModelFilter === 'all' ||
        (effectiveModelFilter === 'free' && item.isFree) ||
        (effectiveModelFilter === 'paid' && !item.isFree);

      if (!byType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.label.toLowerCase().includes(normalizedSearch) ||
        item.provider.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [allModels, modelFilter, modelSearch]);

  const defaultFreeModel = allModels.find((item) => item.isFree)?.id;
  const selectedModelCandidate =
    model || defaultFreeModel || modelsQuery.data?.defaultModel || allModels[0]?.id || '';
  const selectedModel = filteredModels.some((item) => item.id === selectedModelCandidate)
    ? selectedModelCandidate
    : filteredModels[0]?.id || selectedModelCandidate;

  const selectedModelItem = allModels.find((item) => item.id === selectedModel) ?? null;

  const renderedPrompt = useMemo(
    () => interpolatePrompt(promptTemplate, variables),
    [promptTemplate, variables],
  );

  const promptLineCount = useMemo(
    () => Math.max(1, promptTemplate.split('\n').length),
    [promptTemplate],
  );

  const duplicateVariableData = useMemo(() => getDuplicateVariableData(variables), [variables]);

  const detectedVariablesCount = useMemo(() => {
    const matches = promptTemplate.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) ?? [];
    return new Set(matches).size;
  }, [promptTemplate]);

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

  const copyRunJson = async (run: SimulationRun) => {
    const payload = {
      createdAt: run.createdAt,
      status: run.status,
      model: run.model,
      prompt: run.prompt,
      output: run.output,
      errorMessage: run.errorMessage,
      latencyMs: run.latencyMs,
      totalTokens: run.totalTokens,
      responseFormat,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Run JSON copied');
    } catch {
      toast.error('Unable to copy run JSON');
    }
  };

  const handleGenerate = () => {
    if (!selectedModel) {
      toast.error('Select a model first');
      return;
    }

    if (duplicateVariableData.duplicateKeys.length > 0) {
      toast.error(`Duplicate variable keys: ${duplicateVariableData.duplicateKeys.join(', ')}`);
      return;
    }

    const parsedTemperature = Number(temperature);

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    const preparedPrompt = renderedPrompt.trim();

    if (!preparedPrompt) {
      toast.error('Prompt is empty after variable substitution');
      return;
    }

    const runId = generateRunId();
    const startedAt = Date.now();

    setRuns((prev) => [
      {
        id: runId,
        createdAt: formatNow(),
        status: 'running',
        model: selectedModel,
        prompt: preparedPrompt,
      },
      ...prev,
    ]);

    generateMutation.mutate(
      {
        data: {
          model: selectedModel,
          prompt: preparedPrompt,
          temperature: parsedTemperature,
          responseFormat,
        },
      },
      {
        onSuccess: (data) => {
          const latencyMs = Date.now() - startedAt;
          const totalTokens = estimateTokens(preparedPrompt + data.output);

          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'success',
                    output: data.output,
                    latencyMs,
                    totalTokens,
                  }
                : run,
            ),
          );
        },
        onError: (error: unknown) => {
          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'error',
                    errorMessage: getApiErrorMessage(error),
                  }
                : run,
            ),
          );
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  if (modelsQuery.isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="text-center text-sm text-slate-500">Loading model catalog...</div>
      </div>
    );
  }

  if (modelsQuery.isError || !modelsQuery.data) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8 shadow-sm">
        <div className="space-y-4 text-center">
          <p className="text-sm text-red-700">Unable to load OpenRouter models.</p>
          <button
            type="button"
            className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            onClick={() => modelsQuery.refetch()}
          >
            Retry
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
