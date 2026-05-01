export interface PromptModelResponse {
  id: string;
  label: string;
  provider: string;
  isFree: boolean;
  supportsStructuredOutputs: boolean;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
}

const toNumberOrNull = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const OPENROUTER_ROUTING_MODEL_IDS = new Set(['openrouter/auto', 'openrouter/free']);

const toPromptModelResponse = (rawModel: unknown): PromptModelResponse | null => {
  if (typeof rawModel !== 'object' || rawModel === null) {
    return null;
  }

  const modelRecord = rawModel as Record<string, unknown>;
  const rawId = modelRecord.id;

  if (typeof rawId !== 'string' || rawId.trim().length === 0) {
    return null;
  }

  const id = rawId.trim();
  const name =
    typeof modelRecord.name === 'string' && modelRecord.name.trim().length > 0
      ? modelRecord.name.trim()
      : id;
  const provider = id.includes('/') ? id.split('/')[0] : 'unknown';
  const supportedParameters = Array.isArray(modelRecord.supported_parameters)
    ? modelRecord.supported_parameters.filter((value): value is string => typeof value === 'string')
    : [];
  const normalizedSupportedParameters = supportedParameters.map((value) => value.toLowerCase());

  const pricingRecord =
    typeof modelRecord.pricing === 'object' && modelRecord.pricing !== null
      ? (modelRecord.pricing as Record<string, unknown>)
      : null;

  const promptPrice = pricingRecord ? toNumberOrNull(pricingRecord.prompt) : null;
  const completionPrice = pricingRecord ? toNumberOrNull(pricingRecord.completion) : null;
  const contextLength = toNumberOrNull(modelRecord.context_length);
  const isFree =
    id.endsWith(':free') ||
    (promptPrice !== null &&
      completionPrice !== null &&
      promptPrice === 0 &&
      completionPrice === 0);
  const supportsStructuredOutputs = normalizedSupportedParameters.includes('structured_outputs');

  return {
    id,
    label: name === id ? id : `${name} (${id})`,
    provider,
    isFree,
    supportsStructuredOutputs,
    contextLength,
    promptPrice,
    completionPrice,
  };
};

export const parseOpenRouterModels = (payload: unknown): PromptModelResponse[] => {
  if (typeof payload !== 'object' || payload === null) {
    return [];
  }

  const payloadRecord = payload as Record<string, unknown>;

  if (!Array.isArray(payloadRecord.data)) {
    return [];
  }

  const uniqueModels = new Map<string, PromptModelResponse>();

  for (const model of payloadRecord.data) {
    const parsedModel = toPromptModelResponse(model);

    if (parsedModel && !uniqueModels.has(parsedModel.id)) {
      uniqueModels.set(parsedModel.id, parsedModel);
    }
  }

  return Array.from(uniqueModels.values()).sort((left, right) =>
    left.label.localeCompare(right.label),
  );
};

export const filterStructuredOutputPromptModels = (models: PromptModelResponse[]) =>
  models.filter(
    (model) => model.supportsStructuredOutputs && !OPENROUTER_ROUTING_MODEL_IDS.has(model.id),
  );

export const resolveDefaultPromptModel = (
  models: PromptModelResponse[],
  configuredDefaultModel?: string,
) => {
  if (configuredDefaultModel && models.some((model) => model.id === configuredDefaultModel)) {
    return configuredDefaultModel;
  }

  return models.find((model) => model.isFree)?.id ?? models[0]?.id ?? '';
};

export const extractOpenRouterErrorMessage = (payload: unknown) => {
  if (typeof payload !== 'object' || payload === null || !('error' in payload)) {
    return 'OpenRouter request failed';
  }

  const errorValue = payload.error;

  if (typeof errorValue !== 'object' || errorValue === null || !('message' in errorValue)) {
    return 'OpenRouter request failed';
  }

  return String(errorValue.message);
};
