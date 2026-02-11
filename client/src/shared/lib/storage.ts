/**
 * Безопасная обертка над localStorage с fallback в память.
 * Решает проблему 'Access to storage is not allowed from this context'.
 */

class SafeStorage implements Storage {
  private memoryStorage: Record<string, string> = {};
  private isAvailable: boolean;

  constructor() {
    this.isAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  get length(): number {
    return this.isAvailable ? window.localStorage.length : Object.keys(this.memoryStorage).length;
  }

  clear(): void {
    if (this.isAvailable) {
      window.localStorage.clear();
    } else {
      this.memoryStorage = {};
    }
  }

  getItem(key: string): string | null {
    if (this.isAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memoryStorage[key] || null;
      }
    }
    return this.memoryStorage[key] || null;
  }

  key(index: number): string | null {
    if (this.isAvailable) {
      return window.localStorage.key(index);
    }
    return Object.keys(this.memoryStorage)[index] || null;
  }

  removeItem(key: string): void {
    if (this.isAvailable) {
      try {
        window.localStorage.removeItem(key);
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
        window.localStorage.setItem(key, value);
      } catch {
        this.memoryStorage[key] = String(value);
      }
    } else {
      this.memoryStorage[key] = String(value);
    }
  }
}

export const safeStorage = new SafeStorage();
