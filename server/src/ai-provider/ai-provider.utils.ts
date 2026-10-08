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

const asRecord = (value: unknown) =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;

const toStringList = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.toLowerCase())
    : null;

/**
 * Каталоги OpenAI-совместимых провайдеров расходятся в деталях:
 * - OpenRouter: `supported_parameters` и цены за токен (`pricing.prompt`) лежат на самой модели;
 * - polza.ai: `type`, а `supported_parameters` и цены за миллион токенов (`prompt_per_million`) —
 *   в `top_provider`;
 * - чистый OpenAI-формат: только `id` и `owned_by`, без сведений о возможностях.
 * Цены передаются как есть, в единицах провайдера.
 */
const toPromptModelResponse = (rawModel: unknown): PromptModelResponse | null => {
  const modelRecord = asRecord(rawModel);

  if (!modelRecord) {
    return null;
  }

  const rawId = modelRecord.id;

  if (typeof rawId !== 'string' || rawId.trim().length === 0) {
    return null;
  }

  if (typeof modelRecord.type === 'string' && modelRecord.type !== 'chat') {
    return null;
  }

  const id = rawId.trim();
  const name =
    typeof modelRecord.name === 'string' && modelRecord.name.trim().length > 0
      ? modelRecord.name.trim()
      : id;
  const provider = id.includes('/')
    ? id.split('/')[0]
    : typeof modelRecord.owned_by === 'string' && modelRecord.owned_by.trim().length > 0
      ? modelRecord.owned_by.trim()
      : 'unknown';
  const topProvider = asRecord(modelRecord.top_provider);
  const openRouterParameters = toStringList(modelRecord.supported_parameters);
  const supportedParameters =
    openRouterParameters ?? toStringList(topProvider?.supported_parameters);

  const pricingRecord = asRecord(modelRecord.pricing) ?? asRecord(topProvider?.pricing);
  const promptPrice = pricingRecord
    ? toNumberOrNull(pricingRecord.prompt ?? pricingRecord.prompt_per_million)
    : null;
  const completionPrice = pricingRecord
    ? toNumberOrNull(pricingRecord.completion ?? pricingRecord.completion_per_million)
    : null;
  const contextLength =
    toNumberOrNull(modelRecord.context_length) ?? toNumberOrNull(topProvider?.context_length);
  const isFree =
    id.endsWith(':free') ||
    (promptPrice !== null &&
      completionPrice !== null &&
      promptPrice === 0 &&
      completionPrice === 0);
  // OpenRouter отличает `response_format` (только json_object) от `structured_outputs`
  // (json_schema). Polza перечисляет только `response_format`. Каталог без сведений о параметрах
  // модель не отсекает: проверку тогда делает сам запрос.
  const supportsStructuredOutputs =
    supportedParameters === null
      ? true
      : supportedParameters.includes('response_format') &&
        (openRouterParameters === null || supportedParameters.includes('structured_outputs'));

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

export const parsePromptModels = (payload: unknown): PromptModelResponse[] => {
  const payloadRecord = asRecord(payload);
  const rawModels = Array.isArray(payload)
    ? payload
    : payloadRecord && Array.isArray(payloadRecord.data)
      ? payloadRecord.data
      : [];

  const uniqueModels = new Map<string, PromptModelResponse>();

  for (const model of rawModels) {
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

/**
 * Сообщение об ошибке провайдера. SDK кладёт тело ответа в `error.error`, а в `message` добавляет
 * код статуса; пользователю показывается текст провайдера без кода.
 */
export const extractAiProviderErrorMessage = (error: unknown, fallback: string) => {
  const errorRecord = asRecord(error);
  const body = asRecord(errorRecord?.error);
  const nested = asRecord(body?.error) ?? body;

  if (nested && typeof nested.message === 'string' && nested.message.trim().length > 0) {
    return nested.message;
  }

  return error instanceof Error && error.message.trim().length > 0 ? error.message : fallback;
};
