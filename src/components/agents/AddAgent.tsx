import { useState, useCallback, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import './AddAgent.css';

interface AddAgentProps {
  onAgentAdd?: () => void;
}

export function AddAgent({ onAgentAdd }: AddAgentProps) {
  const { addAgent, selectAgent } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  const handleStartAdding = useCallback(() => {
    setIsAdding(true);
    setName('');
  }, []);

  const handleCancel = useCallback(() => {
    setIsAdding(false);
    setName('');
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName) {
      const agent = addAgent(trimmedName);
      selectAgent(agent.id);
      onAgentAdd?.();
    }
    setIsAdding(false);
    setName('');
  }, [name, addAgent, selectAgent, onAgentAdd]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleCancel]);

  if (isAdding) {
    return (
      <form className="add-agent-form" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Agent name"
          className="add-agent-input"
        />
        <div className="add-agent-actions">
          <button
            type="submit"
            className="add-agent-submit"
            disabled={!name.trim()}
          >
            Add
          </button>
          <button
            type="button"
            className="add-agent-cancel"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <button className="add-agent-button" onClick={handleStartAdding}>
      + Add Agent
    </button>
  );
}
