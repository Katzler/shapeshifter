import './ShiftSection.css';
import { AgentRow } from './AgentRow';
import { GapIndicator } from './GapIndicator';
import type { Shift } from '../../types';

interface ShiftSectionProps {
  shift: Shift;
  assignedAgentName: string | null;
  onAgentTap?: () => void;
}

export function ShiftSection({ shift, assignedAgentName, onAgentTap }: ShiftSectionProps) {
  return (
    <div className="shift-section">
      <div className="shift-section__header">
        <span className="shift-section__label">{shift.label}</span>
        <span className="shift-section__time">
          {shift.startTime} – {shift.endTime}
        </span>
      </div>
      <div className="shift-section__content">
        {assignedAgentName ? (
          <AgentRow name={assignedAgentName} onTap={onAgentTap} />
        ) : (
          <GapIndicator />
        )}
      </div>
    </div>
  );
}
