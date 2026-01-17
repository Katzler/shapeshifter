import { useApp } from '../../store';
import { AgentListItem } from './AgentListItem';
import './AgentList.css';

interface AgentListProps {
  onAgentSelect?: () => void;
}

export function AgentList({ onAgentSelect }: AgentListProps) {
  const { agents, selectedAgentId } = useApp();

  if (agents.length === 0) {
    return (
      <div className="agent-list-empty">
        <p className="empty-title">No agents yet</p>
        <p className="empty-hint">Add your first team member to start tracking shift preferences</p>
      </div>
    );
  }

  return (
    <ul className="agent-list">
      {agents.map((agent) => (
        <AgentListItem
          key={agent.id}
          agent={agent}
          isSelected={selectedAgentId === agent.id}
          onSelect={onAgentSelect}
        />
      ))}
    </ul>
  );
}
