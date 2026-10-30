import { describe, expect, it } from 'vitest';

import {
  extractApiValidationIssues,
  getApiErrorMessage,
  getApiErrorStatus,
  parseApiError,
} from './api-error';

describe('getApiErrorStatus', () => {
  it('reads the HTTP status and returns null when there is none', () => {
    expect(getApiErrorStatus({ response: { status: 404 } })).toBe(404);
    expect(getApiErrorStatus(new Error('network'))).toBeNull();
    expect(getApiErrorStatus({ response: {} })).toBeNull();
  });
});

describe('getApiErrorMessage', () => {
  it('reads nested server error messages', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            error: {
              message: 'Human message',
            },
          },
        },
      }),
    ).toBe('Human message');
  });

  it('uses the provided fallback for unknown error shapes', () => {
    expect(getApiErrorMessage(new Error('network'), { fallbackMessage: 'Request failed' })).toBe(
      'Request failed',
    );
  });

  it('uses the fallback for responses without structured data', () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            status: 500,
          },
        },
        { fallbackMessage: 'Request failed' },
      ),
    ).toBe('Request failed');
  });

  it('uses the fallback for non-record response data', () => {
    expect(
      getApiErrorMessage(
        {
          response: {
            data: 'Internal server error',
          },
        },
        { fallbackMessage: 'Request failed' },
      ),
    ).toBe('Request failed');
  });

  it('shows a readable field message for validation details', () => {
    expect(
      getApiErrorMessage({
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: [
                { path: 'privacyPolicyUrl', message: 'Invalid URL' },
                { path: 'privacyPolicyUrl', message: 'URL must use http or https' },
              ],
            },
          },
        },
      }),
    ).toBe('Политика обработки ПДн: укажите полный адрес, начинающийся с http:// или https://');
  });
});

describe('parseApiError', () => {
  it('keeps the explicit session message for unauthorized responses', () => {
    expect(
      parseApiError({
        response: {
          status: 401,
          data: {
            error: {
              message: 'Unauthorized',
            },
          },
        },
      }),
    ).toBe('Сессия истекла или доступ запрещен. Войдите заново.');
  });

  it('returns the backend unavailable message for request-only errors', () => {
    expect(parseApiError({ request: {} })).toBe('Сервер недоступен. Попробуйте позже.');
  });
});

describe('extractApiValidationIssues', () => {
  it('returns normalized field issues for a validation response', () => {
    expect(
      extractApiValidationIssues({
        response: {
          data: {
            error: {
              code: 'VALIDATION_ERROR',
              details: [
                { path: 'name', message: 'Название слишком короткое' },
                { path: 'privacyPolicyUrl', message: 'Invalid URL' },
                { path: 'privacyPolicyUrl', message: 'URL must use http or https' },
              ],
            },
          },
        },
      }),
    ).toEqual([
      { path: 'name', message: 'Название слишком короткое' },
      {
        path: 'privacyPolicyUrl',
        message: 'укажите полный адрес, начинающийся с http:// или https://',
      },
    ]);
  });

  it('returns an empty array for non-validation errors', () => {
    expect(
      extractApiValidationIssues({
        response: { data: { error: { code: 'HTTP_ERROR', details: [] } } },
      }),
    ).toEqual([]);
  });
});

describe('переводы прикладных ошибок сервера', () => {
  const apiError = (code: string, message: string) => ({
    response: { data: { error: { code, message } } },
  });

  it('переводит занятый короткий код и сохраняет сам код', () => {
    expect(
      parseApiError(
        apiError('SHORT_CODE_TAKEN', 'Public link short code "MC5CKWDB" already exists'),
      ),
    ).toBe('Короткий код «MC5CKWDB» уже занят. Укажите другой.');
  });

  it('переводит отказ входа по коду, а не по тексту', () => {
    expect(parseApiError(apiError('INVALID_CREDENTIALS', 'Access Denied'))).toBe(
      'Неверный email или пароль',
    );
  });

  it('переводит частые прикладные отказы админки', () => {
    expect(parseApiError(apiError('PUBLIC_LINK_NOT_FOUND', 'Public link not found'))).toBe(
      'Публичная ссылка не найдена. Возможно, ее уже удалили.',
    );
    expect(parseApiError(apiError('NO_ACTIVE_DRAFT', 'Topic has no active draft version'))).toBe(
      'У теста нет версии в работе',
    );
    expect(parseApiError(apiError('ADMIN_ONLY', 'Admin area only'))).toBe(
      'Раздел доступен только администраторам',
    );
  });

  it('не зависит от формулировки: правка текста на сервере не возвращает английский', () => {
    expect(parseApiError(apiError('PUBLIC_LINK_NOT_FOUND', 'Link is gone'))).toBe(
      'Публичная ссылка не найдена. Возможно, ее уже удалили.',
    );
  });

  it('оставляет незнакомый код и русский текст сервера как есть', () => {
    expect(parseApiError(apiError('SOMETHING_NEW', 'Something entirely new happened'))).toBe(
      'Something entirely new happened',
    );
    expect(parseApiError(apiError('INN_INVALID', 'ИНН должен состоять из 10 или 12 цифр'))).toBe(
      'ИНН должен состоять из 10 или 12 цифр',
    );
  });
});
