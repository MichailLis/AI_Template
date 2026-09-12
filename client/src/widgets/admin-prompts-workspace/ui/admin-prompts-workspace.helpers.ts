import type { DuplicateVariableData, SimulationRun } from '../model/types';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  AnalysisPromptListResponseDtoPromptsItem,
  PromptSimulationResponseDto,
} from '@/shared/api/model';

export interface PromptUsageSummary {
  publishedVersionNumber: number | null;
  testsOnPublishedVersion: number;
  testsOnOutdatedVersions: number;
}

/**
 * У промпта действует одна опубликованная версия, но тест привязан к конкретной версии и может
 * остаться на прежней. Поэтому «используется в N тестах» разделено: сколько тестов уже на
 * действующей версии и сколько осталось на устаревших — второе число и есть цена молчаливой
 * правки промпта.
 */
export const getPromptUsageSummary = (
  prompt: AnalysisPromptListResponseDtoPromptsItem,
): PromptUsageSummary => {
  const publishedVersion = prompt.versions.find((version) => version.status === 'PUBLISHED');

  const testsOnOutdatedVersions = prompt.versions
    .filter((version) => version.id !== publishedVersion?.id)
    .reduce((total, version) => total + version.usedInTestCount, 0);

  return {
    publishedVersionNumber: publishedVersion?.versionNumber ?? null,
    testsOnPublishedVersion: publishedVersion?.usedInTestCount ?? 0,
    testsOnOutdatedVersions,
  };
};

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

  // Модель из каталога остается выбранной, даже если фильтр ее скрывает: иначе фильтр «Бесплатные»
  // молча подменял сохраненную модель промпта первой бесплатной, и сохранялась уже она.
  if (allModels.some((item) => item.id === selectedModelCandidate)) {
    return selectedModelCandidate;
  }

  return filteredModels[0]?.id || selectedModelCandidate;
};

export interface PromptModelMismatch {
  versionNumber: number;
  savedModel: string;
}

/** Модель сохраненной версии, если в редакторе выбрана другая; для нового промпта — `null`. */
export const getPromptModelMismatch = (
  prompt: AnalysisPromptListResponseDtoPromptsItem | null,
  selectedModel: string,
): PromptModelMismatch | null => {
  const latestVersion = prompt?.versions[0];

  if (!latestVersion || !selectedModel || latestVersion.model === selectedModel) {
    return null;
  }

  return { versionNumber: latestVersion.versionNumber, savedModel: latestVersion.model };
};
