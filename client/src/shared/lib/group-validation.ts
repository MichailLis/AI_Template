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

interface GroupValidationConfigInput {
  mode: GroupValidationMode;
  pattern: string;
  example: string;
  hint: string;
}

export const parseGroupValidationMode = (value: string): GroupValidationMode => {
  if (value === 'HINT' || value === 'STRICT') {
    return value;
  }

  return 'NONE';
};

export const hasMissingGroupValidationPattern = ({
  mode,
  pattern,
}: Pick<GroupValidationConfigInput, 'mode' | 'pattern'>) => {
  return mode !== 'NONE' && !pattern.trim();
};

export const normalizeGroupValidationConfig = ({
  mode,
  pattern,
  example,
  hint,
}: GroupValidationConfigInput) => {
  const normalizedPattern = pattern.trim();
  const normalizedExample = example.trim();
  const normalizedHint = hint.trim();

  return {
    groupValidationMode: mode,
    groupValidationPattern: normalizedPattern || null,
    groupValidationExample: normalizedExample || null,
    groupValidationHint: normalizedHint || null,
  };
};
