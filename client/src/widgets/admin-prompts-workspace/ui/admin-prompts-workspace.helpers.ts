import type { DuplicateVariableData, SimulationRun } from '../model/types';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  PromptSimulationResponseDto,
} from '@/shared/api/model';

interface ValidateSimulationInputParams {
  selectedModel: string;
  duplicateVariableData: DuplicateVariableData;
  temperature: string;
  renderedPrompt: string;
}

export const validateSimulationInput = ({
  selectedModel,
  duplicateVariableData,
  temperature,
  renderedPrompt,
}: ValidateSimulationInputParams):
  | { ok: true; parsedTemperature: number; preparedPrompt: string }
  | { ok: false; error: string } => {
  if (!selectedModel) {
    return { ok: false, error: 'Select a model first' };
  }

  if (duplicateVariableData.duplicateKeys.length > 0) {
    return {
      ok: false,
      error: `Duplicate variable keys: ${duplicateVariableData.duplicateKeys.join(', ')}`,
    };
  }

  const parsedTemperature = Number(temperature);
  if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
    return { ok: false, error: 'Temperature must be between 0 and 2' };
  }

  const preparedPrompt = renderedPrompt.trim();
  if (!preparedPrompt) {
    return { ok: false, error: 'Prompt is empty after variable substitution' };
  }

  return { ok: true, parsedTemperature, preparedPrompt };
};

export const buildRunningSimulationRun = (
  runId: string,
  selectedModel: string,
  preparedPrompt: string,
  createdAt: string,
): SimulationRun => ({
  id: runId,
  createdAt,
  status: 'running',
  model: selectedModel,
  prompt: preparedPrompt,
});

export const applySimulationSuccess = (
  runs: SimulationRun[],
  runId: string,
  result: PromptSimulationResponseDto,
  latencyMs: number,
  totalTokens: number,
): SimulationRun[] => {
  return runs.map(
    (run): SimulationRun =>
      run.id === runId
        ? {
            ...run,
            status: 'success',
            output: result.output,
            latencyMs,
            totalTokens,
          }
        : run,
  );
};

export const applySimulationError = (
  runs: SimulationRun[],
  runId: string,
  errorMessage: string,
): SimulationRun[] => {
  return runs.map(
    (run): SimulationRun =>
      run.id === runId
        ? {
            ...run,
            status: 'error',
            errorMessage,
          }
        : run,
  );
};

export const resolveSelectedPromptModel = (
  selectedModel: string,
  filteredModels: AdminPromptModelsResponseDtoModelsItem[],
  allModels: AdminPromptModelsResponseDtoModelsItem[],
  defaultModel?: string,
) => {
  const defaultFreeModel = allModels.find((item) => item.isFree)?.id;
  const selectedModelCandidate =
    selectedModel || defaultModel || defaultFreeModel || allModels[0]?.id || '';

  if (filteredModels.some((item) => item.id === selectedModelCandidate)) {
    return selectedModelCandidate;
  }

  return filteredModels[0]?.id || selectedModelCandidate;
};
