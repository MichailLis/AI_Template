import { describe, expect, it } from 'vitest';

import {
  formatDate,
  formatDateTime,
  formatDateTimeOrDash,
  formatDateTimePrecise,
  formatDateTimePreciseOrDash,
  formatTime,
} from './date-format';

/**
 * Формат зафиксирован в русской локали намеренно: до этого он зависел от локали браузера, и на
 * англоязычной машине даты в таблицах выглядели как `9/6/2026, 6:36:12 PM`. Проверяем именно
 * структуру строки, а не точное время: оно зависит от часового пояса машины.
 */
describe('единый формат даты', () => {
  const value = '2026-05-22T10:30:45.000Z';

  it('пишет дату и время без секунд', () => {
    expect(formatDateTime(value)).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}$/);
  });

  it('добавляет секунды в точном формате', () => {
    expect(formatDateTimePrecise(value)).toMatch(/^\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}:\d{2}$/);
  });

  it('умеет отдавать только дату', () => {
    expect(formatDate(value)).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  /**
   * Время без даты нужно журналам в пределах одного дня, например запускам симуляции промпта.
   * Раньше оно шло через `toLocaleTimeString()` без локали и на англоязычной машине выглядело как
   * `11:00:56 PM`.
   */
  it('умеет отдавать только время в 24-часовом формате с секундами', () => {
    expect(formatTime(value)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(formatTime(value)).not.toMatch(/AM|PM/);
  });

  it('не зависит от локали браузера', () => {
    expect(formatDateTime(value)).not.toBe(new Date(value).toLocaleString('en-US'));
  });
});

describe('пропущенные и некорректные значения', () => {
  it('возвращает прочерк для отсутствующего значения', () => {
    expect(formatDateTimeOrDash(null)).toBe('—');
    expect(formatDateTimeOrDash(undefined)).toBe('—');
    expect(formatDateTimePreciseOrDash(null)).toBe('—');
  });

  it('возвращает исходную строку, если это не дата', () => {
    expect(formatDateTimeOrDash('')).toBe('');
    expect(formatDateTime('не дата')).toBe('не дата');
  });
});
