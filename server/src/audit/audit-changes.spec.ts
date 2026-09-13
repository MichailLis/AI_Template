import { collectAuditChanges } from './audit-changes';

/**
 * Находка аудита FLOW-06: у пользователей, промптов, настроек и ссылок не было следа «кто, что,
 * когда, было → стало». Журнал хранит только изменившиеся поля и значения строками, чтобы история
 * читалась одинаково для любой сущности.
 */
describe('collectAuditChanges', () => {
  it('keeps only the fields whose value changed', () => {
    expect(
      collectAuditChanges(
        { role: 'USER', name: 'Анна', deactivatedAt: null },
        { role: 'ADMIN', name: 'Анна', deactivatedAt: null },
        { fields: ['role', 'name', 'deactivatedAt'] },
      ),
    ).toEqual([{ field: 'role', before: 'USER', after: 'ADMIN' }]);
  });

  it('writes dates, numbers and booleans as text and keeps missing values as null', () => {
    expect(
      collectAuditChanges(
        { startsAt: null, maxAttemptsPerStudent: 3, isActive: true },
        {
          startsAt: new Date('2026-09-01T10:00:00.000Z'),
          maxAttemptsPerStudent: 5,
          isActive: false,
        },
        { fields: ['startsAt', 'maxAttemptsPerStudent', 'isActive'] },
      ),
    ).toEqual([
      { field: 'startsAt', before: null, after: '2026-09-01T10:00:00.000Z' },
      { field: 'maxAttemptsPerStudent', before: '3', after: '5' },
      { field: 'isActive', before: 'true', after: 'false' },
    ]);
  });

  it('treats equal dates as unchanged', () => {
    expect(
      collectAuditChanges(
        { endsAt: new Date('2026-09-01T10:00:00.000Z') },
        { endsAt: new Date('2026-09-01T10:00:00.000Z') },
        { fields: ['endsAt'] },
      ),
    ).toEqual([]);
  });

  it('marks a changed long text or secret without storing its content', () => {
    expect(
      collectAuditChanges(
        { prompt: 'Старый текст промпта', title: 'A' },
        { prompt: 'Новый текст промпта', title: 'A' },
        { fields: ['title'], redactedFields: ['prompt'] },
      ),
    ).toEqual([{ field: 'prompt', before: null, after: null }]);
  });

  it('ignores a redacted field that did not change', () => {
    expect(
      collectAuditChanges(
        { consentText: 'Согласие' },
        { consentText: 'Согласие' },
        { fields: [], redactedFields: ['consentText'] },
      ),
    ).toEqual([]);
  });
});
