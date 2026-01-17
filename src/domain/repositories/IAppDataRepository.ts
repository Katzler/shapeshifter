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
   */
  save(data: AppData): void;

  /**
   * Clear all stored data.
   */
  clear(): void;
}
