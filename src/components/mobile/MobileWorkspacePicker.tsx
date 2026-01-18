import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import { useEditableField } from '../../hooks';
import type { WorkspaceMeta } from '../../types';
import './MobileWorkspacePicker.css';

interface MobileWorkspaceItemProps {
  workspace: WorkspaceMeta;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function MobileWorkspaceItem({
  workspace,
  isActive,
  onSwitch,
  onRename,
  onDelete,
  canDelete,
}: MobileWorkspaceItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const nameField = useEditableField({
    initialValue: workspace.name,
    onSubmit: onRename,
    validate: (name) => name.trim().length > 0,
  });

  const handleTap = useCallback(() => {
    if (!nameField.isEditing && !isConfirmingDelete) {
      onSwitch();
    }
  }, [nameField.isEditing, isConfirmingDelete, onSwitch]);

  const handleEditTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    nameField.startEditing();
  }, [nameField]);

  const handleDeleteTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  }, []);

  const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  }, [onDelete]);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  }, []);

  if (isConfirmingDelete) {
    return (
      <li className="mobile-workspace-item mobile-workspace-item--confirming">
        <span className="mobile-workspace-item__confirm-text">Delete "{workspace.name}"?</span>
        <div className="mobile-workspace-item__confirm-actions">
          <button className="mobile-workspace-item__confirm-yes" onClick={handleConfirmDelete}>
            Delete
          </button>
          <button className="mobile-workspace-item__confirm-no" onClick={handleCancelDelete}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`mobile-workspace-item ${isActive ? 'mobile-workspace-item--active' : ''}`}
      onClick={handleTap}
    >
      {nameField.isEditing ? (
        <input
          ref={nameField.inputRef}
          type="text"
          className="mobile-workspace-item__input"
          value={nameField.value}
          onChange={(e) => nameField.setValue(e.target.value)}
          onKeyDown={nameField.handleKeyDown}
          onBlur={nameField.submit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="mobile-workspace-item__indicator">{isActive ? '●' : '○'}</span>
          <span className="mobile-workspace-item__name">{workspace.name}</span>
          <button
            className="mobile-workspace-item__action"
            onClick={handleEditTap}
            aria-label="Rename workspace"
          >
            ✎
          </button>
          {canDelete && (
            <button
              className="mobile-workspace-item__action mobile-workspace-item__action--delete"
              onClick={handleDeleteTap}
              aria-label="Delete workspace"
            >
              ×
            </button>
          )}
        </>
      )}
    </li>
  );
}

interface MobileWorkspacePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileWorkspacePicker({ isOpen, onClose }: MobileWorkspacePickerProps) {
  const {
    currentWorkspace,
    workspaces,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useApp();

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [isCreating]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setIsCreating(false);
      setNewName('');
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newName.trim();
    if (trimmed) {
      const created = createWorkspace(trimmed);
      if (created) {
        onClose();
      }
    }
    setIsCreating(false);
    setNewName('');
  }, [newName, createWorkspace, onClose]);

  const handleCreateCancel = useCallback(() => {
    setIsCreating(false);
    setNewName('');
  }, []);

  const handleCreateKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateSubmit();
    } else if (e.key === 'Escape') {
      handleCreateCancel();
    }
  }, [handleCreateSubmit, handleCreateCancel]);

  const handleSwitch = useCallback((workspaceId: string) => {
    switchWorkspace(workspaceId);
    onClose();
  }, [switchWorkspace, onClose]);

  const canDelete = workspaces.length > 1;

  if (!isOpen) return null;

  return (
    <div className="mobile-workspace-picker__backdrop" onClick={handleBackdropClick}>
      <div className="mobile-workspace-picker__sheet" ref={sheetRef}>
        <div className="mobile-workspace-picker__header">
          <h2 className="mobile-workspace-picker__title">Workspaces</h2>
          <button className="mobile-workspace-picker__close" onClick={onClose}>
            ×
          </button>
        </div>

        <ul className="mobile-workspace-picker__list">
          {workspaces.map((workspace) => (
            <MobileWorkspaceItem
              key={workspace.id}
              workspace={workspace}
              isActive={workspace.id === currentWorkspace.id}
              onSwitch={() => handleSwitch(workspace.id)}
              onRename={(name) => renameWorkspace(workspace.id, name)}
              onDelete={() => deleteWorkspace(workspace.id)}
              canDelete={canDelete}
            />
          ))}
        </ul>

        {isCreating ? (
          <div className="mobile-workspace-picker__create-form">
            <input
              ref={newNameInputRef}
              type="text"
              className="mobile-workspace-picker__create-input"
              placeholder="Workspace name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleCreateKeyDown}
              onBlur={handleCreateSubmit}
            />
          </div>
        ) : (
          <button className="mobile-workspace-picker__create-button" onClick={handleStartCreate}>
            + New workspace
          </button>
        )}
      </div>
    </div>
  );
}

interface WorkspaceTriggerProps {
  onClick: () => void;
}

export function MobileWorkspaceTrigger({ onClick }: WorkspaceTriggerProps) {
  const { currentWorkspace } = useApp();

  return (
    <button className="mobile-workspace-trigger" onClick={onClick}>
      <span className="mobile-workspace-trigger__name">{currentWorkspace.name}</span>
      <span className="mobile-workspace-trigger__chevron">▼</span>
    </button>
  );
}
