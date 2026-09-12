import { describe, expect, it } from 'vitest';

import {
  formatIsoDateAsRu,
  formatIsoDateTimeLocalAsRu,
  maskRuDateInput,
  maskRuDateTimeInput,
  parseRuDate,
  parseRuDateTime,
} from './date-input';

/**
 * Находка аудита UX-09: нативный `<input type="date">` показывает маску из языка интерфейса
 * браузера, и в англоязычном Chromium это `mm/dd/yyyy` — 06/09 и 09/06 путаются, и отчёт строится
 * не за тот период. Атрибут `lang` на это не влияет. Поле с маской ДД.ММ.ГГГГ снимает зависимость от
 * браузера, а наружу отдаёт тот же формат `ГГГГ-ММ-ДД`, что и нативное поле.
 */
describe('maskRuDateInput', () => {
  it('leaves empty and short input as it is', () => {
    expect(maskRuDateInput('')).toBe('');
    expect(maskRuDateInput('0')).toBe('0');
    expect(maskRuDateInput('06')).toBe('06');
  });

  it('inserts the dots as the digits arrive', () => {
    expect(maskRuDateInput('060')).toBe('06.0');
    expect(maskRuDateInput('0609')).toBe('06.09');
    expect(maskRuDateInput('06092')).toBe('06.09.2');
    expect(maskRuDateInput('06092026')).toBe('06.09.2026');
  });

  it('keeps an already formatted date and ignores any non-digit characters', () => {
    expect(maskRuDateInput('06.09.2026')).toBe('06.09.2026');
    expect(maskRuDateInput('ab06/09/2026x')).toBe('06.09.2026');
  });

  it('drops digits beyond a full date', () => {
    expect(maskRuDateInput('060920261')).toBe('06.09.2026');
  });
});

describe('parseRuDate', () => {
  it('turns a complete date into the ISO date the filters send', () => {
    expect(parseRuDate('06.09.2026')).toBe('2026-09-06');
    expect(parseRuDate('01.12.2025')).toBe('2025-12-01');
  });

  it('accepts a leap day only in a leap year', () => {
    expect(parseRuDate('29.02.2024')).toBe('2024-02-29');
    expect(parseRuDate('29.02.2026')).toBeNull();
  });

  it('rejects dates that do not exist', () => {
    expect(parseRuDate('31.02.2026')).toBeNull();
    expect(parseRuDate('00.01.2026')).toBeNull();
    expect(parseRuDate('12.13.2026')).toBeNull();
  });

  it('rejects incomplete or empty input', () => {
    expect(parseRuDate('06.09.20')).toBeNull();
    expect(parseRuDate('')).toBeNull();
  });
});

describe('formatIsoDateAsRu', () => {
  it('shows an ISO date in the Russian day-first order', () => {
    expect(formatIsoDateAsRu('2026-09-06')).toBe('06.09.2026');
  });

  it('shows nothing for an empty or malformed value', () => {
    expect(formatIsoDateAsRu('')).toBe('');
    expect(formatIsoDateAsRu('not-a-date')).toBe('');
  });
});

/**
 * Дата публикации политики была `<input type="datetime-local">` с той же маской браузера. Вариант с
 * временем отдаёт наружу тот же формат `ГГГГ-ММ-ДДTЧЧ:мм`, что и нативное поле.
 */
describe('maskRuDateTimeInput', () => {
  it('masks the date part exactly like the date-only field', () => {
    expect(maskRuDateTimeInput('0609')).toBe('06.09');
    expect(maskRuDateTimeInput('06092026')).toBe('06.09.2026');
  });

  it('adds a space before the time and a colon inside it as the digits arrive', () => {
    expect(maskRuDateTimeInput('060920261')).toBe('06.09.2026 1');
    expect(maskRuDateTimeInput('0609202614')).toBe('06.09.2026 14');
    expect(maskRuDateTimeInput('06092026143')).toBe('06.09.2026 14:3');
    expect(maskRuDateTimeInput('060920261430')).toBe('06.09.2026 14:30');
  });

  it('keeps an already formatted value and drops digits beyond minutes', () => {
    expect(maskRuDateTimeInput('06.09.2026 14:30')).toBe('06.09.2026 14:30');
    expect(maskRuDateTimeInput('0609202614309')).toBe('06.09.2026 14:30');
  });
});

describe('parseRuDateTime', () => {
  it('turns a complete date and time into the datetime-local value', () => {
    expect(parseRuDateTime('06.09.2026 14:30')).toBe('2026-09-06T14:30');
    expect(parseRuDateTime('10.07.2026 00:00')).toBe('2026-07-10T00:00');
  });

  it('rejects impossible hours, minutes and dates', () => {
    expect(parseRuDateTime('06.09.2026 24:00')).toBeNull();
    expect(parseRuDateTime('06.09.2026 12:60')).toBeNull();
    expect(parseRuDateTime('31.02.2026 10:00')).toBeNull();
  });

  it('requires the time part', () => {
    expect(parseRuDateTime('06.09.2026')).toBeNull();
    expect(parseRuDateTime('06.09.2026 14')).toBeNull();
    expect(parseRuDateTime('')).toBeNull();
  });
});

describe('formatIsoDateTimeLocalAsRu', () => {
  it('shows a datetime-local value in the Russian order', () => {
    expect(formatIsoDateTimeLocalAsRu('2026-07-10T03:00')).toBe('10.07.2026 03:00');
  });

  it('shows nothing for an empty or malformed value', () => {
    expect(formatIsoDateTimeLocalAsRu('')).toBe('');
    expect(formatIsoDateTimeLocalAsRu('2026-07-10')).toBe('');
  });
});
