import './MobileScheduleView.css';
import { useMemo } from 'react';
import { ShiftSection } from './ShiftSection';
import { useApp } from '../../store';
import { DAYS, SHIFTS, type DayOfWeek } from '../../types';

interface MobileScheduleViewProps {
  selectedDay: DayOfWeek;
}

export function MobileScheduleView({ selectedDay }: MobileScheduleViewProps) {
  const { agents, schedule } = useApp();

  const dayLabel = DAYS.find((d) => d.id === selectedDay)?.label ?? selectedDay;
  const daySchedule = schedule[selectedDay];

  // Build a map of agentId -> agent name for quick lookup
  const agentNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents) {
      map.set(agent.id, agent.name);
    }
    return map;
  }, [agents]);

  // Check if any shifts are assigned for the whole week
  const hasAnySchedule = useMemo(() => {
    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        if (schedule[day.id][shift.id] !== null) {
          return true;
        }
      }
    }
    return false;
  }, [schedule]);

  // Empty state: no schedule generated
  if (!hasAnySchedule) {
    return (
      <div className="mobile-schedule-view">
        <div className="mobile-schedule-view__day-header">
          <h2 className="mobile-schedule-view__day-title">{dayLabel}</h2>
        </div>
        <div className="mobile-schedule-view__empty">
          <p className="mobile-schedule-view__empty-title">No schedule yet</p>
          <p className="mobile-schedule-view__empty-hint">
            Generate a schedule on desktop to view assignments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-schedule-view">
      <div className="mobile-schedule-view__day-header">
        <h2 className="mobile-schedule-view__day-title">{dayLabel}</h2>
      </div>

      <div className="mobile-schedule-view__shifts">
        {SHIFTS.map((shift) => {
          const assignedId = daySchedule[shift.id];
          const assignedName = assignedId ? agentNames.get(assignedId) ?? null : null;

          return (
            <ShiftSection
              key={shift.id}
              shift={shift}
              assignedAgentName={assignedName}
            />
          );
        })}
      </div>
    </div>
  );
}
