import { useState, useCallback } from 'react';
import { useApp } from '../../store';
import { useImportWorkflow } from '../../hooks';
import './DataActions.css';

export function DataActions() {
  const { agents, exportData, importData, importAsNewWorkspace } = useApp();
  const [exportSuccess, setExportSuccess] = useState(false);

  const importWorkflow = useImportWorkflow({
    onImport: importData,
    onImportAsNew: importAsNewWorkspace,
  });

  const handleExport = useCallback(() => {
    exportData();
    setExportSuccess(true);
    setTimeout(() => setExportSuccess(false), 2000);
  }, [exportData]);

  return (
    <div className="data-actions">
      <input
        ref={importWorkflow.fileInputRef}
        type="file"
        accept=".json"
        onChange={importWorkflow.handleFileSelect}
        style={{ display: 'none' }}
      />

      {importWorkflow.status === 'idle' && !exportSuccess && (
        <>
          <button className="data-action-btn" onClick={handleExport}>
            <span className="icon">↓</span> Export
          </button>
          <button className="data-action-btn" onClick={importWorkflow.openFilePicker}>
            <span className="icon">↑</span> Import
          </button>
        </>
      )}

      {exportSuccess && (
        <p className="import-status success">Exported!</p>
      )}

      {importWorkflow.status === 'confirming' && importWorkflow.pendingData && (
        <div className="import-confirm">
          <p className="confirm-info">
            Import {importWorkflow.pendingData.agents.length} agent
            {importWorkflow.pendingData.agents.length !== 1 ? 's' : ''}
            {importWorkflow.pendingWorkspaceName && (
              <span className="confirm-workspace"> from "{importWorkflow.pendingWorkspaceName}"</span>
            )}
          </p>
          <div className="confirm-buttons-vertical">
            {importWorkflow.canImportAsNew && (
              <button className="confirm-btn new" onClick={importWorkflow.importAsNewWorkspace}>
                Create New Workspace
              </button>
            )}
            <button className="confirm-btn replace" onClick={importWorkflow.confirmImport}>
              Replace Current ({agents.length} agent{agents.length !== 1 ? 's' : ''})
            </button>
            <button className="confirm-btn cancel" onClick={importWorkflow.cancelImport}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {importWorkflow.status === 'loading' && (
        <p className="import-status loading">Reading file...</p>
      )}

      {importWorkflow.status === 'success' && (
        <p className="import-status success">Import successful!</p>
      )}

      {importWorkflow.status === 'error' && (
        <div className="import-error">
          <p className="error-message">{importWorkflow.errorMessage}</p>
          <button className="dismiss-btn" onClick={importWorkflow.dismissError}>
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
