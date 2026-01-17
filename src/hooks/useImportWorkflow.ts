import { useState, useRef, useCallback } from 'react';
import type { AppData } from '../types';
import { fileService } from '../infrastructure';

type ImportStatus = 'idle' | 'loading' | 'confirming' | 'success' | 'error';

interface UseImportWorkflowOptions {
  /** Called when import is confirmed with valid data */
  onImport: (data: AppData) => void;
  /** Duration in ms to show success message before returning to idle */
  successDuration?: number;
}

interface UseImportWorkflowReturn {
  /** Current status of the import workflow */
  status: ImportStatus;
  /** Error message when status is 'error' */
  errorMessage: string;
  /** Pending data when status is 'confirming' */
  pendingData: AppData | null;
  /** Ref to attach to the hidden file input */
  fileInputRef: React.RefObject<HTMLInputElement>;
  /** Trigger the file picker */
  openFilePicker: () => void;
  /** Handle file selection from input */
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  /** Confirm the import */
  confirmImport: () => void;
  /** Cancel the import */
  cancelImport: () => void;
  /** Dismiss error and return to idle */
  dismissError: () => void;
}

/**
 * Hook for managing the import workflow state machine.
 *
 * States:
 * - idle: Ready to import
 * - loading: Reading file
 * - confirming: File read successfully, waiting for user confirmation
 * - success: Import completed (auto-returns to idle)
 * - error: Import failed (requires dismissal)
 */
export function useImportWorkflow({
  onImport,
  successDuration = 2000,
}: UseImportWorkflowOptions): UseImportWorkflowReturn {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingData, setPendingData] = useState<AppData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null!);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    e.target.value = '';

    setStatus('loading');

    const result = await fileService.readImportFile(file);

    if (result.valid && result.data) {
      setPendingData(result.data);
      setStatus('confirming');
    } else {
      setErrorMessage(result.error || 'Unknown error');
      setStatus('error');
    }
  }, []);

  const confirmImport = useCallback(() => {
    if (!pendingData) return;

    onImport(pendingData);
    setPendingData(null);
    setStatus('success');
    setTimeout(() => setStatus('idle'), successDuration);
  }, [pendingData, onImport, successDuration]);

  const cancelImport = useCallback(() => {
    setPendingData(null);
    setStatus('idle');
  }, []);

  const dismissError = useCallback(() => {
    setStatus('idle');
    setErrorMessage('');
  }, []);

  return {
    status,
    errorMessage,
    pendingData,
    fileInputRef,
    openFilePicker,
    handleFileSelect,
    confirmImport,
    cancelImport,
    dismissError,
  };
}
