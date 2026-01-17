import type { AppData } from '../../types';
import { normalizeAppData } from '../../types';
import type { IAppDataRepository } from '../../domain/repositories';

const STORAGE_KEY = 'shapeshifter-data';

/**
 * LocalStorage implementation of the AppData repository.
 * Persists application data to browser LocalStorage.
 */
export class LocalStorageAppDataRepository implements IAppDataRepository {
  load(): AppData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return null;
      }
      const parsed = JSON.parse(raw);
      return normalizeAppData(parsed);
    } catch (error) {
      console.warn('Failed to load data from LocalStorage:', error);
      return null;
    }
  }

  save(data: AppData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save data to LocalStorage:', error);
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Default singleton instance for the application.
 */
export const appDataRepository = new LocalStorageAppDataRepository();
