import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import type { Agent } from '../../types';
import './AgentListItem.css';

interface AgentListItemProps {
  agent: Agent;
  isSelected: boolean;
}

export function AgentListItem({ agent, isSelected }: AgentListItemProps) {
  const { selectAgent, renameAgent, deleteAgent, setContractHours } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(agent.name);
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [editHours, setEditHours] = useState(String(agent.contractHoursPerWeek));
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hoursInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (isEditingHours && hoursInputRef.current) {
      hoursInputRef.current.focus();
      hoursInputRef.current.select();
    }
  }, [isEditingHours]);

  const handleClick = () => {
    if (!isEditing && !isConfirmingDelete && !isEditingHours) {
      selectAgent(agent.id);
    }
  };

  const handleDoubleClick = () => {
    setEditName(agent.name);
    setIsEditing(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = editName.trim();
    if (trimmed) {
      renameAgent(agent.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleRenameCancel = () => {
    setEditName(agent.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      handleRenameCancel();
    }
  };

  const handleHoursClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditHours(String(agent.contractHoursPerWeek));
    setIsEditingHours(true);
  };

  const handleHoursSubmit = () => {
    const hours = parseInt(editHours, 10);
    if (!isNaN(hours) && hours > 0) {
      setContractHours(agent.id, hours);
    }
    setIsEditingHours(false);
  };

  const handleHoursKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleHoursSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingHours(false);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  };

  const handleConfirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAgent(agent.id);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  if (isConfirmingDelete) {
    return (
      <li className="agent-list-item confirming">
        <span className="confirm-text">Delete "{agent.name}"?</span>
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
      className={`agent-list-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          className="agent-name-input"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleRenameSubmit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="agent-name">{agent.name}</span>
          {isEditingHours ? (
            <input
              ref={hoursInputRef}
              type="number"
              className="hours-input"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value)}
              onKeyDown={handleHoursKeyDown}
              onBlur={handleHoursSubmit}
              onClick={(e) => e.stopPropagation()}
              min="1"
              max="168"
            />
          ) : (
            <span
              className="hours-badge"
              onClick={handleHoursClick}
              title="Contract hours/week (click to edit)"
            >
              {agent.contractHoursPerWeek}h
            </span>
          )}
          <button
            className="edit-button"
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleClick();
            }}
            title="Rename agent"
          >
            ✎
          </button>
          <button
            className="delete-button"
            onClick={handleDeleteClick}
            title="Delete agent"
          >
            ×
          </button>
        </>
      )}
    </li>
  );
}
