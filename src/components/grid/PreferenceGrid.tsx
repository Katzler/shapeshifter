import { useApp } from '../../store';
import { PreferenceCell } from './PreferenceCell';
import { ShiftGrid } from '../common';
import './PreferenceGrid.css';

export function PreferenceGrid() {
  const { agents, selectedAgentId } = useApp();

  const selectedAgent = agents.find((a) => a.id === selectedAgentId);

  if (!selectedAgent) {
    return (
      <div className="preference-grid-empty">
        <p>Select an agent to edit preferences</p>
      </div>
    );
  }

  return (
    <div className="preference-grid-container">
      <h2 className="preference-grid-title">{selectedAgent.name}</h2>
      <ShiftGrid
        className="preference-grid"
        renderCell={(day, shift) => (
          <PreferenceCell
            agentId={selectedAgent.id}
            day={day}
            shift={shift}
            status={selectedAgent.preferences[day][shift]}
          />
        )}
      />
    </div>
  );
}
