import './StatusBadge.css';
import type { CoverageStatus } from '../../domain';

interface StatusBadgeProps {
  status: CoverageStatus;
  showLabel?: boolean;
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

export function StatusBadge({ status, showLabel = true }: StatusBadgeProps) {
  return (
    <span
      className={`status-badge status-badge--${status}`}
      role="status"
      aria-label={STATUS_LABELS[status]}
    >
      <span className="status-badge__icon" aria-hidden="true">
        {STATUS_ICONS[status]}
      </span>
      {showLabel && (
        <span className="status-badge__label">{STATUS_LABELS[status]}</span>
      )}
    </span>
  );
}
