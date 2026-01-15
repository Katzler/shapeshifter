import { useMemo } from 'react';
import { useApp } from '../../store';
import { DAYS, SHIFTS, shiftDurationHours } from '../../types';
import type { DayOfWeek, ShiftId } from '../../types';
import './ScheduleGrid.css';

interface ScheduleCellProps {
  day: DayOfWeek;
  shift: ShiftId;
}

function ScheduleCell({ day, shift }: ScheduleCellProps) {
  const { agents, schedule, setScheduleAssignment } = useApp();
  const assignedId = schedule[day][shift];
  const assignedAgent = agents.find((a) => a.id === assignedId);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setScheduleAssignment(day, shift, value === '' ? null : value);
  };

  return (
    <div className={`schedule-cell ${assignedAgent ? 'assigned' : 'unassigned'}`}>
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

  const agentHours = useMemo(() => {
    const hours: Map<string, number> = new Map();
    for (const agent of agents) {
      hours.set(agent.id, 0);
    }
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        const agentId = schedule[day.id][shift.id];
        if (agentId && hours.has(agentId)) {
          hours.set(agentId, hours.get(agentId)! + shiftDurationHours(shift.id));
        }
      }
    }
    return hours;
  }, [agents, schedule]);

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
          const diff = assigned - target;
          let status = '';
          if (diff < -8) status = 'under';
          else if (diff > 8) status = 'over';

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
          <div className="schedule-grid">
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
                <div
                  key={`${shift.id}-header`}
                  className="grid-cell grid-header shift-header"
                >
                  <span className="shift-label">{shift.label}</span>
                  <span className="shift-time">
                    {shift.startTime}–{shift.endTime}
                  </span>
                </div>

                {/* Schedule cells for this shift */}
                {DAYS.map((day) => (
                  <ScheduleCell
                    key={`${shift.id}-${day.id}`}
                    day={day.id}
                    shift={shift.id}
                  />
                ))}
              </>
            ))}
          </div>

          <ScheduleSummary />
        </>
      )}
    </div>
  );
}
