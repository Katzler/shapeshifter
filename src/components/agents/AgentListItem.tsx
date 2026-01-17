import { useState, useCallback } from 'react';
import { useApp } from '../../store';
import { useEditableField } from '../../hooks';
import type { Agent } from '../../types';
import './AgentListItem.css';

interface AgentListItemProps {
  agent: Agent;
  isSelected: boolean;
  onSelect?: () => void;
}

export function AgentListItem({ agent, isSelected, onSelect }: AgentListItemProps) {
  const { selectAgent, renameAgent, deleteAgent, setContractHours } = useApp();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Name editing
  const nameField = useEditableField({
    initialValue: agent.name,
    onSubmit: (name) => renameAgent(agent.id, name),
    validate: (name) => name.trim().length > 0,
  });

  // Hours editing
  const hoursField = useEditableField({
    initialValue: String(agent.contractHoursPerWeek),
    onSubmit: (value) => {
      const hours = parseInt(value, 10);
      if (!isNaN(hours) && hours > 0) {
        setContractHours(agent.id, hours);
      }
    },
    validate: (value) => {
      const hours = parseInt(value, 10);
      return !isNaN(hours) && hours > 0;
    },
  });

  const handleClick = useCallback(() => {
    if (!nameField.isEditing && !isConfirmingDelete && !hoursField.isEditing) {
      selectAgent(agent.id);
      onSelect?.();
    }
  }, [nameField.isEditing, hoursField.isEditing, isConfirmingDelete, selectAgent, agent.id, onSelect]);

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(true);
  }, []);

  const handleConfirmDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAgent(agent.id);
  }, [deleteAgent, agent.id]);

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  }, []);

  const handleHoursClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    hoursField.startEditing();
  }, [hoursField]);

  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    nameField.startEditing();
  }, [nameField]);

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
      onDoubleClick={nameField.startEditing}
    >
      {nameField.isEditing ? (
        <input
          ref={nameField.inputRef}
          type="text"
          className="agent-name-input"
          value={nameField.value}
          onChange={(e) => nameField.setValue(e.target.value)}
          onKeyDown={nameField.handleKeyDown}
          onBlur={nameField.submit}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <span className="agent-name">{agent.name}</span>
          {hoursField.isEditing ? (
            <input
              ref={hoursField.inputRef}
              type="number"
              className="hours-input"
              value={hoursField.value}
              onChange={(e) => hoursField.setValue(e.target.value)}
              onKeyDown={hoursField.handleKeyDown}
              onBlur={hoursField.submit}
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
            onClick={handleEditClick}
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
