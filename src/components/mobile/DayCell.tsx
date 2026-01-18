import './DayCell.css';
import type { DayOfWeek } from '../../types';

interface DayCellProps {
  day: DayOfWeek;
  label: string;
  isSelected: boolean;
  isToday: boolean;
  onClick: (day: DayOfWeek) => void;
}

export function DayCell({ day, label, isSelected, isToday, onClick }: DayCellProps) {
  const handleClick = () => {
    onClick(day);
  };

  return (
    <button
      className={`day-cell ${isSelected ? 'day-cell--selected' : ''} ${isToday ? 'day-cell--today' : ''}`}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`${label}${isToday ? ' (Today)' : ''}${isSelected ? ', selected' : ''}`}
    >
      <span className="day-cell__label">{label.slice(0, 3)}</span>
      {isToday && <span className="day-cell__today-dot" aria-hidden="true" />}
    </button>
  );
}
