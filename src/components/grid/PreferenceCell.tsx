import { useApp } from '../../store';
import type { DayOfWeek, ShiftId, PreferenceStatus } from '../../types';
import './PreferenceCell.css';

interface PreferenceCellProps {
  agentId: string;
  day: DayOfWeek;
  shift: ShiftId;
  status: PreferenceStatus;
}

const STATUS_ICONS: Record<PreferenceStatus, string> = {
  neutral: '–',
  available: '✓',
  unavailable: '✗',
};

export function PreferenceCell({ agentId, day, shift, status }: PreferenceCellProps) {
  const { cyclePreference } = useApp();

  const handleClick = () => {
    cyclePreference(agentId, day, shift);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      cyclePreference(agentId, day, shift);
    }
  };

  return (
    <button
      className={`preference-cell status-${status}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-label={`${day} ${shift}: ${status}`}
    >
      <span className="status-icon">{STATUS_ICONS[status]}</span>
    </button>
  );
}
