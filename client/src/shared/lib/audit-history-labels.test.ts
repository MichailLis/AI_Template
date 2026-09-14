import { describe, expect, it } from 'vitest';

import { formatAuditChange, getAuditActionLabel, getAuditActorLabel } from './audit-history-labels';
import { formatDateTime } from './date-format';

/**
 * Находка аудита FLOW-06: журнал хранит служебные значения (`ADMIN`, `DEACTIVATED`, `true`), а
 * админу нужна история человеческим языком.
 */
describe('audit history labels', () => {
  it('names known actions and leaves an unknown one as it is', () => {
    expect(getAuditActionLabel('USER_ROLE_CHANGED')).toBe('Изменена роль');
    expect(getAuditActionLabel('PUBLIC_LINK_CODE_REGENERATED')).toBe('Перевыпущен код ссылки');
    expect(getAuditActionLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });

  it('writes a change as the field with its old and new values', () => {
    expect(formatAuditChange({ field: 'role', before: 'USER', after: 'ADMIN' })).toBe(
      'Роль: Пользователь → Администратор',
    );
    expect(formatAuditChange({ field: 'status', before: 'ACTIVE', after: 'DEACTIVATED' })).toBe(
      'Доступ: включен → отключен',
    );
    expect(formatAuditChange({ field: 'isActive', before: 'true', after: 'false' })).toBe(
      'Ссылка активна: да → нет',
    );
    expect(formatAuditChange({ field: 'topicVersionNumber', before: '1', after: '2' })).toBe(
      'Версия теста: v1 → v2',
    );
  });

  it('shows a missing value as a dash and formats dates', () => {
    expect(
      formatAuditChange({ field: 'startsAt', before: null, after: '2026-09-01T10:00:00.000Z' }),
    ).toBe(`Начало доступа: — → ${formatDateTime('2026-09-01T10:00:00.000Z')}`);
  });

  it('says only that a hidden text changed', () => {
    expect(formatAuditChange({ field: 'prompt', before: null, after: null })).toBe(
      'Текст промпта: изменен',
    );
  });

  it('keeps an unknown field and its raw values', () => {
    expect(formatAuditChange({ field: 'newField', before: 'a', after: 'b' })).toBe(
      'newField: a → b',
    );
  });

  it('names the author by name, then by email, and says when there is none', () => {
    expect(getAuditActorLabel({ id: 1, email: 'admin@admin.admin', name: 'Анна' })).toBe('Анна');
    expect(getAuditActorLabel({ id: 1, email: 'admin@admin.admin', name: null })).toBe(
      'admin@admin.admin',
    );
    expect(getAuditActorLabel(null)).toBe('Автор неизвестен');
  });
});
