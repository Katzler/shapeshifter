import { useMemo } from 'react';
import { useApp } from '../../store';
import { getScheduleCellStatus, getPreferenceLabel } from '../../types';
import type { DayOfWeek, ShiftId } from '../../types';
import { calculateAgentHours, getHourStatus } from '../../domain';
import { ShiftGrid } from '../common';
import './ScheduleGrid.css';

interface ScheduleCellProps {
  day: DayOfWeek;
  shift: ShiftId;
}

function ScheduleCell({ day, shift }: ScheduleCellProps) {
  const { agents, schedule, setScheduleAssignment } = useApp();
  const assignedId = schedule[day][shift];
  const assignedAgent = agents.find((a) => a.id === assignedId);
  const preference = assignedAgent?.preferences[day][shift];
  const cellStatus = getScheduleCellStatus(!!assignedAgent, preference);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setScheduleAssignment(day, shift, value === '' ? null : value);
  };

  const tooltip = assignedAgent
    ? `${assignedAgent.name}: ${getPreferenceLabel(preference)}`
    : undefined;

  return (
    <div className={`schedule-cell ${cellStatus}`} title={tooltip}>
      <select value={assignedId ?? ''} onChange={handleChange}>
        <option value="">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function ScheduleSummary() {
  const { agents, schedule } = useApp();

  const agentHours = useMemo(
    () => calculateAgentHours(agents, schedule),
    [agents, schedule]
  );

  if (agents.length === 0) {
    return null;
  }

  return (
    <div className="schedule-summary">
      <h3>Hours Summary</h3>
      <div className="summary-list">
        {agents.map((agent) => {
          const assigned = agentHours.get(agent.id) ?? 0;
          const target = agent.contractHoursPerWeek;
          const status = getHourStatus(assigned, target);

          return (
            <div key={agent.id} className={`summary-item ${status}`}>
              <span className="summary-name">{agent.name}</span>
              <span className="summary-hours">
                {assigned}h / {target}h
                {status === 'under' && ' ↓'}
                {status === 'over' && ' ↑'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleGrid() {
  const { agents, suggestSchedule, clearSchedule } = useApp();

  return (
    <div className="schedule-grid-container">
      <div className="schedule-header">
        <h2>Weekly Schedule</h2>
        <div className="schedule-actions">
          <button
            className="schedule-btn suggest"
            onClick={suggestSchedule}
            disabled={agents.length === 0}
          >
            Suggest Week
          </button>
          <button className="schedule-btn clear" onClick={clearSchedule}>
            Clear Schedule
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <p className="schedule-empty">Add agents to create a schedule.</p>
      ) : (
        <>
          <ShiftGrid
            className="schedule-grid"
            renderCell={(day, shift) => (
              <ScheduleCell day={day} shift={shift} />
            )}
          />
          <ScheduleSummary />
        </>
      )}
    </div>
  );
}
