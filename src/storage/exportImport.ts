import type { AppData } from '../types';
import { normalizeAppData } from '../types';

/**
 * Export app data to a downloadable JSON file.
 */
export function exportToFile(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().split('T')[0];
  const filename = `shapeshifter-${date}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validation result for imported data.
 */
export interface ImportValidationResult {
  valid: boolean;
  data?: AppData;
  error?: string;
}

/**
 * Parse JSON string and normalize as AppData.
 */
export function parseImportData(jsonString: string): ImportValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { valid: false, error: 'File is not valid JSON' };
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { valid: false, error: 'File does not contain a valid JSON object' };
  }

  const normalized = normalizeAppData(parsed);
  return { valid: true, data: normalized };
}

/**
 * Read a File object and parse it as AppData.
 */
export function readImportFile(file: File): Promise<ImportValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        resolve({ valid: false, error: 'Failed to read file contents' });
        return;
      }
      resolve(parseImportData(content));
    };

    reader.onerror = () => {
      resolve({ valid: false, error: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
}
