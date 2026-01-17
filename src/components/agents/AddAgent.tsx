import { useState, useCallback } from 'react';
import { useApp } from '../../store';
import { useEditableField } from '../../hooks';
import './AddAgent.css';

export function AddAgent() {
  const { addAgent, selectAgent } = useApp();
  const [isAdding, setIsAdding] = useState(false);

  const nameField = useEditableField({
    initialValue: '',
    onSubmit: (name) => {
      const trimmed = name.trim();
      if (trimmed) {
        const agent = addAgent(trimmed);
        selectAgent(agent.id);
      }
      setIsAdding(false);
    },
    validate: (name) => name.trim().length > 0,
  });

  const handleStartAdding = useCallback(() => {
    setIsAdding(true);
    nameField.startEditing();
  }, [nameField]);

  const handleCancel = useCallback(() => {
    nameField.cancel();
    setIsAdding(false);
  }, [nameField]);

  if (isAdding) {
    return (
      <div className="add-agent-input">
        <input
          ref={nameField.inputRef}
          type="text"
          value={nameField.value}
          onChange={(e) => nameField.setValue(e.target.value)}
          onKeyDown={nameField.handleKeyDown}
          onBlur={handleCancel}
          placeholder="Agent name"
        />
      </div>
    );
  }

  return (
    <button className="add-agent-button" onClick={handleStartAdding}>
      + Add Agent
    </button>
  );
}
