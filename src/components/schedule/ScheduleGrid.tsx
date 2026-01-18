import { useMemo, useCallback, memo } from 'react';
import { useApp } from '../../store';
import { getScheduleCellStatus, getPreferenceLabel, DAYS, SHIFTS } from '../../types';
import type { Agent, DayOfWeek, ShiftId } from '../../types';
import {
  calculateAgentHours,
  getHourStatus,
  validateAssignment,
  getViolationLabel,
  calculateCoverage,
  getWeekCoverageSummary,
} from '../../domain';
import type { AssignmentViolation } from '../../domain';
import { ShiftGrid } from '../common';
import './ScheduleGrid.css';

function hasAnyAvailability(agents: Agent[]): boolean {
  for (const agent of agents) {
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        const status = agent.preferences[day.id][shift.id];
        if (status === 'available' || status === 'neutral') {
          return true;
        }
      }
    }
  }
  return false;
}

interface AgentOption {
  agent: Agent;
  valid: boolean;
  violation: AssignmentViolation | null;
}

interface ScheduleCellProps {
  day: DayOfWeek;
  shift: ShiftId;
}

const ScheduleCell = memo(function ScheduleCell({ day, shift }: ScheduleCellProps) {
  const { agents, schedule, setScheduleAssignment } = useApp();
  const assignedId = schedule[day][shift];
  const assignedAgent = agents.find((a) => a.id === assignedId);
  const preference = assignedAgent?.preferences[day][shift];
  const cellStatus = getScheduleCellStatus(!!assignedAgent, preference);

  // Compute valid/invalid status for each agent
  const agentOptions: AgentOption[] = useMemo(() => {
    return agents.map((agent) => {
      // Skip validation for currently assigned agent (allow keeping them)
      if (agent.id === assignedId) {
        return { agent, valid: true, violation: null };
      }
      const result = validateAssignment(agent, day, shift, schedule);
      if (result.valid) {
        return { agent, valid: true, violation: null };
      }
      return { agent, valid: false, violation: result.reason };
    });
  }, [agents, day, shift, schedule, assignedId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setScheduleAssignment(day, shift, value === '' ? null : value);
  };

  const tooltip = assignedAgent
    ? `${assignedAgent.name}: ${getPreferenceLabel(preference)}`
    : undefined;

  const dayLabel = DAYS.find((d) => d.id === day)?.label ?? day;
  const shiftLabel = SHIFTS.find((s) => s.id === shift)?.label ?? shift;
  const ariaLabel = `${dayLabel} ${shiftLabel} assignment`;

  return (
    <div className={`schedule-cell ${cellStatus}`} title={tooltip}>
      <select
        value={assignedId ?? ''}
        onChange={handleChange}
        aria-label={ariaLabel}
      >
        <option value="">Unassigned</option>
        {agentOptions.map(({ agent, valid, violation }) => (
          <option
            key={agent.id}
            value={agent.id}
            disabled={!valid}
            title={violation ? getViolationLabel(violation) : undefined}
          >
            {agent.name}
            {violation ? ` (${getViolationLabel(violation)})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
});

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
          const direction = assigned < target ? 'under' : assigned > target ? 'over' : null;

          return (
            <div key={agent.id} className={`summary-item summary-item--${status}`}>
              <span className="summary-name">{agent.name}</span>
              <span className="summary-hours">
                {assigned}h / {target}h
                {direction === 'under' && ' ↓'}
                {direction === 'over' && ' ↑'}
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

  const anyAvailability = useMemo(() => hasAnyAvailability(agents), [agents]);
  const showNoAvailabilityNote = agents.length > 0 && !anyAvailability;

  // Check for gaps before generating
  const coverageSummary = useMemo(() => {
    if (agents.length === 0) return null;
    const coverage = calculateCoverage(agents);
    return getWeekCoverageSummary(coverage);
  }, [agents]);

  const handleSuggestSchedule = useCallback(() => {
    if (coverageSummary && coverageSummary.gapShifts > 0) {
      const { gapShifts, gapDetails } = coverageSummary;
      const gapText = gapShifts <= 3
        ? gapDetails.map(g => `${g.day} ${g.shift}`).join(', ')
        : `${gapShifts} shifts`;
      const confirmed = window.confirm(
        `Warning: ${gapText} ${gapShifts === 1 ? 'has' : 'have'} no available agents.\n\n` +
        `These shifts will remain unassigned. Continue anyway?`
      );
      if (!confirmed) return;
    }
    suggestSchedule();
  }, [coverageSummary, suggestSchedule]);

  const handleClearSchedule = useCallback(() => {
    if (window.confirm('Clear all shift assignments for this week?')) {
      clearSchedule();
    }
  }, [clearSchedule]);

  return (
    <div className="schedule-grid-container">
      <div className="schedule-header">
        <h2>Weekly Schedule</h2>
        <div className="schedule-actions">
          <button
            className="schedule-btn suggest"
            onClick={handleSuggestSchedule}
            disabled={agents.length === 0 || !anyAvailability}
          >
            Suggest Week
          </button>
          <button className="schedule-btn clear" onClick={handleClearSchedule}>
            Clear Schedule
          </button>
        </div>
      </div>

      {agents.length === 0 ? (
        <p className="schedule-empty">Add agents to create a schedule.</p>
      ) : (
        <>
          {showNoAvailabilityNote && (
            <p className="schedule-note">
              No availability set. Select an agent to open their shifts before scheduling.
            </p>
          )}
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
