import './AgentRow.css';

interface AgentRowProps {
  name: string;
  onTap?: () => void;
}

export function AgentRow({ name, onTap }: AgentRowProps) {
  return (
    <button
      className="agent-row"
      onClick={onTap}
      type="button"
      aria-label={`${name}. Tap for details.`}
    >
      <span className="agent-row__avatar" aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </span>
      <span className="agent-row__name">{name}</span>
    </button>
  );
}
