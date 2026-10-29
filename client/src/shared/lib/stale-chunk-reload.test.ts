import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleStalePreloadError } from './stale-chunk-reload';
import { safeStorage } from './storage';

describe('handleStalePreloadError', () => {
  const reload = vi.fn();

  beforeEach(() => {
    reload.mockClear();
    safeStorage.clear();
  });

  it('reloads once and then lets the error through inside the cooldown', () => {
    const first = new Event('vite:preloadError', { cancelable: true });
    handleStalePreloadError(first, 1_000, reload);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(first.defaultPrevented).toBe(true);

    const second = new Event('vite:preloadError', { cancelable: true });
    handleStalePreloadError(second, 30_000, reload);

    expect(reload).toHaveBeenCalledTimes(1);
    expect(second.defaultPrevented).toBe(false);
  });

  it('reloads again after the cooldown', () => {
    handleStalePreloadError(new Event('vite:preloadError', { cancelable: true }), 1_000, reload);
    handleStalePreloadError(new Event('vite:preloadError', { cancelable: true }), 70_000, reload);

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
