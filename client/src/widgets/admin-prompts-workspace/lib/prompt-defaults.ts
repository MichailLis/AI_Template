import type { AdminPromptModelsResponseDtoModelsItem } from '@/shared/api/model';

export const DEFAULT_TEMPERATURE = '0.7';

export const getDefaultModel = (
  structuredOutputModels: AdminPromptModelsResponseDtoModelsItem[],
  defaultModel?: string,
) =>
  defaultModel ??
  structuredOutputModels.find((item) => item.isFree)?.id ??
  structuredOutputModels[0]?.id ??
  '';

export const getPromptModelFilter = (
  selectedCatalogModel: AdminPromptModelsResponseDtoModelsItem | null,
) => (selectedCatalogModel?.isFree ? 'free' : 'paid');
