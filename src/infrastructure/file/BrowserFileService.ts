import type { AppData } from '../../types';
import { normalizeAppData } from '../../types';
import type { IFileService, ImportResult } from '../../domain/repositories';

/**
 * Browser-based implementation of file import/export.
 * Uses browser File API and download mechanisms.
 */
export class BrowserFileService implements IFileService {
  exportToFile(data: AppData, workspaceName?: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const date = new Date().toISOString().split('T')[0];
    // Include workspace name in filename if provided
    const safeName = workspaceName
      ? workspaceName.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20)
      : 'data';
    const filename = `shapeshifter-${safeName}-${date}.json`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async readImportFile(file: File): Promise<ImportResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content !== 'string') {
          resolve({ valid: false, error: 'Failed to read file contents' });
          return;
        }
        resolve(this.parseImportData(content));
      };

      reader.onerror = () => {
        resolve({ valid: false, error: 'Failed to read file' });
      };

      reader.readAsText(file);
    });
  }

  private parseImportData(jsonString: string): ImportResult {
    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return { valid: false, error: 'File is not valid JSON' };
    }

    if (typeof parsed !== 'object' || parsed === null) {
      return { valid: false, error: 'File does not contain a valid JSON object' };
    }

    // Extract workspace name if present
    const obj = parsed as Record<string, unknown>;
    const workspaceName = typeof obj.workspaceName === 'string' ? obj.workspaceName : undefined;

    const normalized = normalizeAppData(parsed);
    return { valid: true, data: normalized, workspaceName };
  }
}

/**
 * Default singleton instance for the application.
 */
export const fileService = new BrowserFileService();
