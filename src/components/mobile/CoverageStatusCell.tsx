import './CoverageStatusCell.css';
import type { CoverageStatus } from '../../domain';
import type { DayOfWeek } from '../../types';

interface CoverageStatusCellProps {
  day: DayOfWeek;
  label: string;
  status: CoverageStatus;
  isSelected: boolean;
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
  onClick,
}: CoverageStatusCellProps) {
  const handleClick = () => {
    onClick(day);
  };

  return (
    <button
      className={`coverage-status-cell coverage-status-cell--${status} ${isSelected ? 'coverage-status-cell--selected' : ''}`}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`${label}: ${STATUS_LABELS[status]}${isSelected ? ', selected' : ''}`}
    >
      <span className="coverage-status-cell__day">{label.slice(0, 3)}</span>
      <span className="coverage-status-cell__icon" aria-hidden="true">
        {STATUS_ICONS[status]}
      </span>
    </button>
  );
}
