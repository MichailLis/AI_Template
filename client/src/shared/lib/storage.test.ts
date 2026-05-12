import { afterEach, describe, expect, it, vi } from 'vitest';

describe('safeStorage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
    window.localStorage.clear();
  });

  it('stores values through browser storage when localStorage is available', async () => {
    const { safeStorage } = await import('./storage');

    safeStorage.clear();
    safeStorage.setItem('token', 'abc');

    expect(safeStorage.getItem('token')).toBe('abc');
    expect(safeStorage.length).toBe(1);

    safeStorage.removeItem('token');

    expect(safeStorage.getItem('token')).toBeNull();
  });

  it('falls back to memory storage when localStorage throws during availability check', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const { safeStorage } = await import('./storage');

    expect(() => safeStorage.setItem('token', 'memory')).not.toThrow();
    expect(safeStorage.getItem('token')).toBe('memory');
    expect(safeStorage.length).toBe(1);

    safeStorage.clear();

    expect(safeStorage.getItem('token')).toBeNull();
    expect(safeStorage.length).toBe(0);
  });
});
