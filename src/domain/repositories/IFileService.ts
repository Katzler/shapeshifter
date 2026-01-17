import type { AppData } from '../../types';

/**
 * Result of validating and parsing imported data.
 */
export interface ImportResult {
  valid: boolean;
  data?: AppData;
  error?: string;
}

/**
 * Service interface for file import/export operations.
 * Implementations handle browser file APIs or other I/O mechanisms.
 */
export interface IFileService {
  /**
   * Export data to a downloadable file.
   * @param data - The application data to export
   */
  exportToFile(data: AppData): void;

  /**
   * Read and parse an imported file.
   * @param file - The file to read
   * @returns Promise resolving to the import result
   */
  readImportFile(file: File): Promise<ImportResult>;
}
