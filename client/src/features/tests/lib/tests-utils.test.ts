import { describe, expect, it } from 'vitest';

import { createEmptyQuestionFormState, createQuestionPayload, parseApiError } from './tests-utils';

describe('parseApiError', () => {
  it('reads the unified server error message from response.data.error.message', () => {
    expect(
      parseApiError({
        response: {
          status: 400,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Human message',
            },
          },
        },
      }),
    ).toBe('Human message');
  });

  it('keeps the explicit session message for unauthorized responses', () => {
    expect(
      parseApiError({
        response: {
          status: 401,
          data: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Unauthorized',
            },
          },
        },
      }),
    ).toBe('Сессия истекла или доступ запрещен. Войдите заново.');
  });
});

describe('createQuestionPayload', () => {
  it('parses question settings only from JSON objects', () => {
    const payload = createQuestionPayload({
      ...createEmptyQuestionFormState(),
      settingsText: '{"maxLength": 400}',
      title: 'Развернутый ответ',
    });

    expect(payload.settings).toEqual({ maxLength: 400 });
  });

  it('omits empty question settings', () => {
    const payload = createQuestionPayload({
      ...createEmptyQuestionFormState(),
      settingsText: '',
      title: 'Развернутый ответ',
    });

    expect(payload.settings).toBeUndefined();
  });

  it('rejects non-object question settings', () => {
    expect(() =>
      createQuestionPayload({
        ...createEmptyQuestionFormState(),
        settingsText: '"not-an-object"',
        title: 'Развернутый ответ',
      }),
    ).toThrow('Дополнительные настройки должны быть JSON-объектом');
  });
});
