import { describe, expect, it } from 'vitest';

import { getApiErrorMessage, parseApiError } from './api-error';

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
