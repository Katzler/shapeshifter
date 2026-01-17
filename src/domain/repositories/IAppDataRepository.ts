import type { AppData } from '../../types';

/**
 * Repository interface for persisting application data.
 * Implementations can use LocalStorage, IndexedDB, or remote APIs.
 */
export interface IAppDataRepository {
  /**
   * Load the current application data.
   * @returns The stored data, or null if none exists
   */
  load(): AppData | null;

  /**
   * Save application data.
   * @param data - The data to persist
   * @returns true if save succeeded, false if it failed (e.g., quota exceeded)
   */
  save(data: AppData): boolean;

  /**
   * Clear all stored data.
   */
  clear(): void;
}
