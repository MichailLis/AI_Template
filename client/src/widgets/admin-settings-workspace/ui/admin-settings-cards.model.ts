import type {
  AdminOpenRouterSettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
} from '@/shared/api/model';

export type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];
export type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];
export type ProfessionAtlasCoverage = NonNullable<ProfessionAtlasSettings['coverage']>;

export const sourceLabels: Record<OpenRouterSettings['source'], string> = {
  ENV: 'Переменная окружения',
  NONE: 'Не задан',
};

export const atlasCoverageStatusLabels: Record<ProfessionAtlasCoverage['status'], string> = {
  ready: 'Готов',
  partial: 'Частично',
  unavailable: 'Недоступен',
};

export const atlasCoverageItemStatusLabels: Record<
  ProfessionAtlasCoverage['items'][number]['status'],
  string
> = {
  found: 'найдено',
  missing: 'не найдено',
  duplicate: 'дубли',
};

export const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return 'не обновлялся через админку';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};
