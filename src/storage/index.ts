import type { AppData } from '../types';
import { normalizeAppData } from '../types';

const STORAGE_KEY = 'shapeshifter-data';

/**
 * Load app data from LocalStorage.
 * Returns null if no data exists or if parsing fails.
 * Normalizes data to ensure all preferences are complete.
 */
export function loadData(): AppData | null {
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

/**
 * Save app data to LocalStorage.
 */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to LocalStorage:', error);
  }
}

/**
 * Remove app data from LocalStorage.
 */
export function clearData(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export { exportToFile, readImportFile } from './exportImport';
export type { ImportValidationResult } from './exportImport';
