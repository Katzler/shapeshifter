import './CoverageStatusCell.css';
import type { CoverageStatus } from '../../domain';
import type { DayOfWeek } from '../../types';

interface CoverageStatusCellProps {
  day: DayOfWeek;
  label: string;
  status: CoverageStatus;
  isSelected: boolean;
  isToday: boolean;
  onClick: (day: DayOfWeek) => void;
}

const STATUS_ICONS: Record<CoverageStatus, string> = {
  covered: '✓',
  tight: '~',
  gap: '!',
};

const STATUS_LABELS: Record<CoverageStatus, string> = {
  covered: 'Covered',
  tight: 'Tight',
  gap: 'Gap',
};

export function CoverageStatusCell({
  day,
  label,
  status,
  isSelected,
  isToday,
  onClick,
}: CoverageStatusCellProps) {
  const handleClick = () => {
    onClick(day);
  };

  const classNames = [
    'coverage-status-cell',
    `coverage-status-cell--${status}`,
    isSelected ? 'coverage-status-cell--selected' : '',
    isToday ? 'coverage-status-cell--today' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`${label}: ${STATUS_LABELS[status]}${isToday ? ' (Today)' : ''}${isSelected ? ', selected' : ''}`}
    >
      <span className="coverage-status-cell__day">{label.slice(0, 3)}</span>
      <span className="coverage-status-cell__icon" aria-hidden="true">
        {STATUS_ICONS[status]}
      </span>
      {isToday && <span className="coverage-status-cell__today-dot" aria-hidden="true" />}
    </button>
  );
}
