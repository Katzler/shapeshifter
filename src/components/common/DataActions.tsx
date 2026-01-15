import { useRef, useState } from 'react';
import { useApp } from '../../store';
import { readImportFile } from '../../storage';
import type { AppData } from '../../types';
import './DataActions.css';

type ImportStatus = 'idle' | 'confirming' | 'loading' | 'success' | 'error';

export function DataActions() {
  const { agents, exportData, importData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingData, setPendingData] = useState<AppData | null>(null);

  const handleExport = () => {
    exportData();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    e.target.value = '';

    setImportStatus('loading');

    const result = await readImportFile(file);

    if (result.valid && result.data) {
      setPendingData(result.data);
      setImportStatus('confirming');
    } else {
      setErrorMessage(result.error || 'Unknown error');
      setImportStatus('error');
    }
  };

  const handleConfirmImport = () => {
    if (!pendingData) return;

    importData(pendingData);
    setPendingData(null);
    setImportStatus('success');
    setTimeout(() => setImportStatus('idle'), 2000);
  };

  const handleCancelImport = () => {
    setPendingData(null);
    setImportStatus('idle');
  };

  const handleDismissError = () => {
    setImportStatus('idle');
    setErrorMessage('');
  };

  return (
    <div className="data-actions">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {importStatus === 'idle' && (
        <>
          <button className="data-action-btn" onClick={handleExport}>
            <span className="icon">↓</span> Export
          </button>
          <button className="data-action-btn" onClick={handleImportClick}>
            <span className="icon">↑</span> Import
          </button>
        </>
      )}

      {importStatus === 'confirming' && pendingData && (
        <div className="import-confirm">
          <p className="confirm-info">
            Import {pendingData.agents.length} agent{pendingData.agents.length !== 1 ? 's' : ''}
          </p>
          <p className="confirm-warning">
            This will replace your {agents.length} existing agent{agents.length !== 1 ? 's' : ''}
          </p>
          <div className="confirm-buttons">
            <button className="confirm-btn yes" onClick={handleConfirmImport}>
              Replace
            </button>
            <button className="confirm-btn no" onClick={handleCancelImport}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {importStatus === 'loading' && (
        <p className="import-status loading">Reading file...</p>
      )}

      {importStatus === 'success' && (
        <p className="import-status success">Import successful!</p>
      )}

      {importStatus === 'error' && (
        <div className="import-error">
          <p className="error-message">{errorMessage}</p>
          <button className="dismiss-btn" onClick={handleDismissError}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
