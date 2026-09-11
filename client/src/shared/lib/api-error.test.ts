import { describe, expect, it } from 'vitest';

import { extractApiValidationIssues, getApiErrorMessage, parseApiError } from './api-error';

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
    expect(parseApiError({ request: {} })).toBe(
      'Сервер недоступен. Проверьте, что backend запущен на localhost:3000.',
    );
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
  const apiError = (message: string) => ({
    response: { data: { error: { code: 'HTTP_ERROR', message } } },
  });

  it('переводит занятый короткий код и сохраняет сам код', () => {
    expect(parseApiError(apiError('Public link short code "MC5CKWDB" already exists'))).toBe(
      'Короткий код «MC5CKWDB» уже занят. Укажите другой.',
    );
  });

  it('переводит отказ входа', () => {
    expect(parseApiError(apiError('Invalid credentials'))).toBe('Неверный email или пароль');
  });

  it('переводит частые прикладные отказы админки', () => {
    expect(parseApiError(apiError('Public link not found'))).toBe(
      'Публичная ссылка не найдена. Возможно, ее уже удалили.',
    );
    expect(parseApiError(apiError('Topic has no active draft version'))).toBe(
      'У теста нет версии в работе',
    );
    expect(parseApiError(apiError('Admin area only'))).toBe(
      'Раздел доступен только администраторам',
    );
  });

  it('оставляет незнакомое сообщение как есть, чтобы не скрыть новую ошибку', () => {
    expect(parseApiError(apiError('Something entirely new happened'))).toBe(
      'Something entirely new happened',
    );
  });
});
