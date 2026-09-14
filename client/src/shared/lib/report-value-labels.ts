import { studentEducationLevelLabels, studentGenderLabels } from './public-test-labels';

/**
 * Человеческие подписи для значений, которые сервер отдает кодами. Незнакомый код показывается
 * как есть: новое значение сервера не должно превращаться в пустую ячейку.
 */
const labelOrRaw = (labels: Record<string, string>, value: string) => labels[value] ?? value;

const versionStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PUBLISHED: 'Опубликована',
  ARCHIVED: 'В архиве',
};

export const questionTypeLabels = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
} as const;

/** Уровни уверенности результата методики v3+ (server/src/tests/prof-orientation-v3-plus/scoring.ts). */
const confidenceLevelLabels: Record<string, string> = {
  high: 'Высокая',
  medium: 'Средняя',
  mixed: 'Смешанная',
  broad: 'Широкий профиль',
  low: 'Низкая',
};

/** Пол и уровень образования в сводках отчета приходят кодами, а место проживания — свободным текстом. */
const demographicValueLabels: Record<string, string> = {
  ...studentGenderLabels,
  ...studentEducationLevelLabels,
};

export const getVersionStatusLabel = (status: string) => labelOrRaw(versionStatusLabels, status);

export const getQuestionTypeLabel = (type: string) => labelOrRaw(questionTypeLabels, type);

export const getConfidenceLevelLabel = (level: string) => labelOrRaw(confidenceLevelLabels, level);

export const getReportValueLabel = (value: string) => labelOrRaw(demographicValueLabels, value);
