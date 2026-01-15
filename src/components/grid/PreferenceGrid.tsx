import { useApp } from '../../store';
import { DAYS, SHIFTS } from '../../types';
import { PreferenceCell } from './PreferenceCell';
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
      <div className="preference-grid">
        {/* Empty corner cell */}
        <div className="grid-cell grid-corner" />

        {/* Day headers */}
        {DAYS.map((day) => (
          <div key={day.id} className="grid-cell grid-header day-header">
            {day.label.slice(0, 3)}
          </div>
        ))}

        {/* Shift rows */}
        {SHIFTS.map((shift) => (
          <>
            {/* Shift header */}
            <div key={`${shift.id}-header`} className="grid-cell grid-header shift-header">
              <span className="shift-label">{shift.label}</span>
              <span className="shift-time">
                {shift.startTime}–{shift.endTime}
              </span>
            </div>

            {/* Preference cells for this shift */}
            {DAYS.map((day) => (
              <PreferenceCell
                key={`${shift.id}-${day.id}`}
                agentId={selectedAgent.id}
                day={day.id}
                shift={shift.id}
                status={selectedAgent.preferences[day.id][shift.id]}
              />
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
