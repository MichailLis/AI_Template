import type { AuditChange } from './audit.types';

const toAuditValue = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
};

interface CollectAuditChangesOptions {
  /** Поля, чьи значения записываются в журнал. */
  fields: readonly string[];
  /**
   * Поля, у которых записывается только факт изменения: длинные тексты промптов, политики и
   * согласия, секреты. Их содержимое в журнал не попадает.
   */
  redactedFields?: readonly string[];
}

/** Изменившиеся поля между состоянием до и после, значения — текстом. */
export const collectAuditChanges = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  { fields, redactedFields = [] }: CollectAuditChangesOptions,
): AuditChange[] => [
  ...fields.flatMap((field) => {
    const beforeValue = toAuditValue(before[field]);
    const afterValue = toAuditValue(after[field]);

    return beforeValue === afterValue ? [] : [{ field, before: beforeValue, after: afterValue }];
  }),
  ...redactedFields.flatMap((field) =>
    toAuditValue(before[field]) === toAuditValue(after[field])
      ? []
      : [{ field, before: null, after: null }],
  ),
];
