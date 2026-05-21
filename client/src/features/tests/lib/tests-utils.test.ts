import { describe, expect, it } from 'vitest';

import { parseApiError } from './tests-utils';

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
