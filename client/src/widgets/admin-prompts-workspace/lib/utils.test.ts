import { afterEach, describe, expect, it, vi } from 'vitest';

import { formatNow } from './utils';

/**
 * Находка аудита UX-09: время запуска симуляции промпта шло через `toLocaleTimeString()` без
 * локали и на англоязычной машине выглядело как `11:00:56 PM`, хотя остальная админка пишет время
 * в 24-часовом формате.
 */
describe('formatNow', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('prints the current time in the shared 24-hour format with seconds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T23:00:56.000Z'));

    const value = formatNow();

    expect(value).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    expect(value).not.toMatch(/AM|PM/);
  });
});
