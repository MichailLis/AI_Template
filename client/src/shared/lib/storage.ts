/**
 * Безопасная обертка над localStorage или sessionStorage с fallback в память.
 * Решает проблему 'Access to storage is not allowed from this context'.
 */

class SafeStorage implements Storage {
  private memoryStorage: Record<string, string> = {};
  private isAvailable: boolean;
  private readonly kind: 'localStorage' | 'sessionStorage';

  constructor(kind: 'localStorage' | 'sessionStorage') {
    this.kind = kind;
    this.isAvailable = this.checkAvailability();
  }

  private get backend(): Storage {
    return window[this.kind];
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__storage_test__';
      this.backend.setItem(testKey, testKey);
      this.backend.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get length(): number {
    return this.isAvailable ? this.backend.length : Object.keys(this.memoryStorage).length;
  }

  clear(): void {
    if (this.isAvailable) {
      this.backend.clear();
    } else {
      this.memoryStorage = {};
    }
  }

  getItem(key: string): string | null {
    if (this.isAvailable) {
      try {
        return this.backend.getItem(key);
      } catch {
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  key(index: number): string | null {
    if (this.isAvailable) {
      return this.backend.key(index);
    }
    return Object.keys(this.memoryStorage)[index] || null;
  }

  removeItem(key: string): void {
    if (this.isAvailable) {
      try {
        this.backend.removeItem(key);
      } catch {
        delete this.memoryStorage[key];
      }
    } else {
      delete this.memoryStorage[key];
    }
  }

  setItem(key: string, value: string): void {
    if (this.isAvailable) {
      try {
        this.backend.setItem(key, value);
      } catch {
        this.memoryStorage[key] = String(value);
      }
    } else {
      this.memoryStorage[key] = String(value);
    }
  }
}

export const safeStorage = new SafeStorage('localStorage');
/** Живёт, пока открыта вкладка: так клиент узнаёт, что браузер закрывали (#176). */
export const safeSessionStorage = new SafeStorage('sessionStorage');
