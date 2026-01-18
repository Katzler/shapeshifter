import './MobileEditorView.css';
import { useCallback } from 'react';
import { ShiftListEditor } from './ShiftListEditor';
import { useApp } from '../../store';
import { DAYS, type DayOfWeek, type ShiftId } from '../../types';

// Get current day of week as DayOfWeek
function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return mapping[dayIndex];
}

interface MobileEditorViewProps {
  selectedDay: DayOfWeek;
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
}

export function MobileEditorView({
  selectedDay,
  selectedAgentId,
  onAgentSelect,
}: MobileEditorViewProps) {
  const { agents, cyclePreference } = useApp();

  const today = getTodayDayOfWeek();
  const isToday = selectedDay === today;
  const selectedAgent = agents.find((a) => a.id === selectedAgentId);
  const dayLabel = DAYS.find((d) => d.id === selectedDay)?.label ?? selectedDay;

  const handleCyclePreference = useCallback(
    (day: DayOfWeek, shift: ShiftId) => {
      if (selectedAgentId) {
        cyclePreference(selectedAgentId, day, shift);
      }
    },
    [selectedAgentId, cyclePreference]
  );

  const handleAgentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onAgentSelect(e.target.value);
    },
    [onAgentSelect]
  );

  // Empty state: no agents
  if (agents.length === 0) {
    return (
      <div className="mobile-editor-view">
        <div className="mobile-editor-view__empty">
          <p className="mobile-editor-view__empty-title">No agents yet</p>
          <p className="mobile-editor-view__empty-hint">
            Add agents on desktop to set availability
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-editor-view">
      {/* Agent selector */}
      <div className="mobile-editor-view__agent-selector">
        <label className="mobile-editor-view__agent-label" htmlFor="agent-select">
          Agent
        </label>
        <select
          id="agent-select"
          className="mobile-editor-view__agent-select"
          value={selectedAgentId ?? ''}
          onChange={handleAgentChange}
        >
          <option value="" disabled>
            Select an agent
          </option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Day header */}
      <div className="mobile-editor-view__day-header">
        <h2 className={`mobile-editor-view__day-title${isToday ? ' mobile-editor-view__day-title--today' : ''}`}>{dayLabel}</h2>
        {selectedAgent && (
          <p className="mobile-editor-view__agent-name">{selectedAgent.name}</p>
        )}
      </div>

      {/* Shift list or prompt to select agent */}
      {selectedAgent ? (
        <ShiftListEditor
          day={selectedDay}
          preferences={selectedAgent.preferences[selectedDay]}
          onCyclePreference={handleCyclePreference}
        />
      ) : (
        <div className="mobile-editor-view__select-prompt">
          <p>Select an agent above to edit their availability</p>
        </div>
      )}
    </div>
  );
}
