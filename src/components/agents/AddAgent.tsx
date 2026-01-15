import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../store';
import './AddAgent.css';

export function AddAgent() {
  const { addAgent, selectAgent } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (trimmed) {
      const agent = addAgent(trimmed);
      selectAgent(agent.id);
      setName('');
      setIsAdding(false);
    }
  };

  const handleCancel = () => {
    setName('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isAdding) {
    return (
      <div className="add-agent-input">
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleCancel}
          placeholder="Agent name"
        />
      </div>
    );
  }

  return (
    <button className="add-agent-button" onClick={() => setIsAdding(true)}>
      + Add Agent
    </button>
  );
}
