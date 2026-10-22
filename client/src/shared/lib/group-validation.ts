export const GROUP_VALIDATION_MODES = {
  NONE: 'NONE',
  HINT: 'HINT',
  STRICT: 'STRICT',
} as const;

export type GroupValidationMode =
  (typeof GROUP_VALIDATION_MODES)[keyof typeof GROUP_VALIDATION_MODES];

export const GROUP_VALIDATION_MODE_LABELS: Record<GroupValidationMode, string> = {
  NONE: 'Без проверки',
  HINT: 'Подсказка',
  STRICT: 'Строгая проверка',
};

export const GROUP_VALIDATION_MODE_OPTIONS: Array<{
  value: GroupValidationMode;
  label: string;
}> = [
  { value: 'NONE', label: 'Без проверки' },
  { value: 'HINT', label: 'Подсказка' },
  { value: 'STRICT', label: 'Строгая проверка' },
];
