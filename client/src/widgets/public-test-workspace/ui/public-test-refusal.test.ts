import { describe, expect, it } from 'vitest';

import { getPublicTestRefusal } from './public-test-refusal';

const fallback = { title: 'Не удалось', description: 'Проверьте данные.' };
const apiError = (code: string, message = 'Bad Request') => ({
  response: { status: 400, data: { success: false, error: { code, message } } },
});

describe('getPublicTestRefusal', () => {
  it('names the reason by the machine code, not by the English message', () => {
    expect(getPublicTestRefusal(apiError('ATTEMPTS_LIMIT_REACHED'), fallback).title).toBe(
      'Попытки закончились',
    );
    expect(getPublicTestRefusal(apiError('LINK_EXPIRED'), fallback).title).toBe(
      'Срок прохождения вышел',
    );
  });

  it('shows the opening time when the link is not open yet and the time is known', () => {
    const refusal = getPublicTestRefusal(
      apiError('LINK_NOT_STARTED'),
      fallback,
      '2026-10-24T07:00:00.000Z',
    );

    expect(refusal.title).toBe('Тест ещё не открыт');
    expect(refusal.description).toMatch(/^Тест откроется 24 октября/);
  });

  it('falls back to the generic text for the not-started code without a time', () => {
    expect(getPublicTestRefusal(apiError('LINK_NOT_STARTED'), fallback).description).toBe(
      'Тестирование по этой ссылке ещё не началось. Вернитесь позже.',
    );
  });

  it('passes the organization hint through for an invalid group format', () => {
    const refusal = getPublicTestRefusal(apiError('GROUP_FORMAT_INVALID', 'Формат: 10А'), fallback);

    expect(refusal.description).toBe('Формат: 10А');
  });

  it('uses the fallback for unknown codes and non-API errors', () => {
    expect(getPublicTestRefusal(apiError('SOMETHING_ELSE'), fallback)).toBe(fallback);
    expect(getPublicTestRefusal(new Error('boom'), fallback)).toBe(fallback);
  });
});
