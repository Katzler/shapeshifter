import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import { useEditableField } from '../../hooks';
import type { WorkspaceMeta } from '../../types';
import './WorkspaceSelector.css';

interface WorkspaceItemProps {
  workspace: WorkspaceMeta;
  isActive: boolean;
  onSwitch: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  canDelete: boolean;
}

function WorkspaceItem({
  workspace,
  isActive,
  onSwitch,
  onRename,
  onDelete,
  canDelete,
}: WorkspaceItemProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const nameField = useEditableField({
    initialValue: workspace.name,
    onSubmit: onRename,
    validate: (name) => name.trim().length > 0,
  });

  const handleClick = useCallback(() => {
    if (!nameField.isEditing && !isConfirmingDelete) {
      onSwitch();
    }
  }, [nameField.isEditing, isConfirmingDelete, onSwitch]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    nameField.startEditing();
  }, [nameField]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
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
      <li className="workspace-item confirming">
        <span className="confirm-text">Delete "{workspace.name}"?</span>
        <div className="confirm-actions">
          <button className="confirm-yes" onClick={handleConfirmDelete}>
            Delete
          </button>
          <button className="confirm-no" onClick={handleCancelDelete}>
            Cancel
          </button>
        </div>
      </li>
    );
  }

  return (
    <li
      className={`workspace-item ${isActive ? 'active' : ''}`}
      onClick={handleClick}
      onDoubleClick={nameField.startEditing}
    >
      {nameField.isEditing ? (
        <input
          ref={nameField.inputRef}
          type="text"
          className="workspace-name-input"
          value={nameField.value}
          onChange={(e) => nameField.setValue(e.target.value)}
          onKeyDown={nameField.handleKeyDown}
          onBlur={nameField.submit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="workspace-indicator">{isActive ? '●' : '○'}</span>
          <span className="workspace-name">{workspace.name}</span>
          <button
            className="workspace-edit-button"
            onClick={handleEditClick}
            title="Rename workspace"
          >
            ✎
          </button>
          {canDelete && (
            <button
              className="workspace-delete-button"
              onClick={handleDeleteClick}
              title="Delete workspace"
            >
              ×
            </button>
          )}
        </>
      )}
    </li>
  );
}

export function WorkspaceSelector() {
  const {
    currentWorkspace,
    workspaces,
    createWorkspace,
    switchWorkspace,
    renameWorkspace,
    deleteWorkspace,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const newNameInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
        setIsCreating(false);
        setNewName('');
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded]);

  // Focus input when creating
  useEffect(() => {
    if (isCreating && newNameInputRef.current) {
      newNameInputRef.current.focus();
    }
  }, [isCreating]);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
    setIsCreating(false);
    setNewName('');
  }, []);

  const handleStartCreate = useCallback(() => {
    setIsCreating(true);
  }, []);

  const handleCreateSubmit = useCallback(() => {
    const trimmed = newName.trim();
    if (trimmed) {
      const created = createWorkspace(trimmed);
      if (created) {
        setIsExpanded(false);
      }
    }
    setIsCreating(false);
    setNewName('');
  }, [newName, createWorkspace]);

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
    setIsExpanded(false);
  }, [switchWorkspace]);

  const canDelete = workspaces.length > 1;

  return (
    <div className="workspace-selector" ref={dropdownRef}>
      <button
        className={`workspace-trigger ${isExpanded ? 'expanded' : ''}`}
        onClick={handleToggle}
      >
        <span className="workspace-trigger-name">{currentWorkspace.name}</span>
        <span className="workspace-trigger-chevron">{isExpanded ? '▲' : '▼'}</span>
      </button>

      {isExpanded && (
        <div className="workspace-dropdown">
          <ul className="workspace-list">
            {workspaces.map((workspace) => (
              <WorkspaceItem
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
            <div className="workspace-create-form">
              <input
                ref={newNameInputRef}
                type="text"
                className="workspace-create-input"
                placeholder="Workspace name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleCreateKeyDown}
                onBlur={handleCreateSubmit}
              />
            </div>
          ) : (
            <button className="workspace-create-button" onClick={handleStartCreate}>
              + New workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}
