import type { DuplicateVariableData, PromptVariable } from '../model/types';

export const getApiErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Request failed';
  }

  const response = error.response;

  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'Request failed';
  }

  const data = response.data;

  if (typeof data !== 'object' || data === null) {
    return 'Request failed';
  }

  if (
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error
  ) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Request failed';
};

export const formatNow = () => new Date().toLocaleTimeString();

export const estimateTokens = (value: string) => Math.max(1, Math.ceil(value.length / 4));

export const generateRunId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createVariableId = () => `var-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

export const interpolatePrompt = (template: string, variables: PromptVariable[]) => {
  let output = template;

  for (const variable of variables) {
    const normalizedKey = variable.key.trim();

    if (!normalizedKey) {
      continue;
    }

    const token = `{{${normalizedKey}}}`;
    output = output.split(token).join(variable.value);
  }

  return output;
};

export const getDuplicateVariableData = (variables: PromptVariable[]): DuplicateVariableData => {
  const keyToIds = new Map<string, string[]>();

  for (const variable of variables) {
    const normalizedKey = variable.key.trim();

    if (!normalizedKey) {
      continue;
    }

    const existingIds = keyToIds.get(normalizedKey) ?? [];
    keyToIds.set(normalizedKey, [...existingIds, variable.id]);
  }

  const duplicateEntries = Array.from(keyToIds.entries()).filter(([, ids]) => ids.length > 1);

  return {
    duplicateKeys: duplicateEntries.map(([key]) => key),
    duplicateIds: new Set(duplicateEntries.flatMap(([, ids]) => ids)),
  };
};
