import type {
  AdminOpenRouterSettingsResponseDto,
  AdminProfessionAtlasSettingsResponseDto,
} from '@/shared/api/model';

export type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];
export type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];

export const sourceLabels: Record<OpenRouterSettings['source'], string> = {
  ENV: 'Переменная окружения',
  NONE: 'Не задан',
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
