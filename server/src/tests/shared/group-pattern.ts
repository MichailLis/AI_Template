/**
 * Шаблон группы/класса — регулярное выражение от администратора. Оно выполняется на сервере и в
 * браузере ученика, поэтому «катастрофические» шаблоны вроде `^(a+)+$` отклоняются при сохранении
 * и не выполняются, если уже сохранены. Клиентская копия: client/src/shared/lib/group-validation.ts.
 *
 * shortcut: ловит только вложенные повторы `(x+)+`, но не пересекающиеся альтернативы `(a|aa)+`;
 * значение группы и так не длиннее 120 символов. Усилить, если появятся такие шаблоны.
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
