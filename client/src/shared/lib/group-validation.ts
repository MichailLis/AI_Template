/**
 * Шаблон группы/класса выполняется в браузере ученика, поэтому «катастрофические» шаблоны вроде
 * `^(a+)+$` не выполняются. Серверная копия авторитетна: server/src/tests/shared/group-pattern.ts.
 */
export const MAX_GROUP_PATTERN_LENGTH = 300;

export const isSafeGroupPattern = (pattern: string) => {
  if (pattern.length > MAX_GROUP_PATTERN_LENGTH) {
    return false;
  }

  const unboundedRepeat = /^(?:[+*]|\{\d+,\})/;
  const groupRepeat = /^(?:[+*]|\{\d+,\d*\})/;

  // Экранированные символы и классы символов не содержат групп и повторов.
  const source = pattern.replace(/\\./g, '_').replace(/\[[^\]]*\]/g, '_');
  // Для каждой открытой группы: есть ли внутри неограниченный повтор.
  const groups: boolean[] = [];

  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '(') {
      groups.push(false);
    } else if (source[index] === ')') {
      const hasInnerRepeat = groups.pop() ?? false;

      if (hasInnerRepeat && groupRepeat.test(source.slice(index + 1))) {
        return false;
      }

      if (hasInnerRepeat && groups.length > 0) {
        groups[groups.length - 1] = true;
      }
    } else if (groups.length > 0 && unboundedRepeat.test(source.slice(index))) {
      groups[groups.length - 1] = true;
    }
  }

  return true;
};

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
