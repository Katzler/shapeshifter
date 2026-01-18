import { useCallback } from 'react';
import './StatusToggle.css';
import type { PreferenceStatus } from '../../types';

interface StatusToggleProps {
  status: PreferenceStatus;
  onToggle: () => void;
}

const STATUS_LABELS: Record<PreferenceStatus, string> = {
  available: 'Available',
  neutral: 'Neutral',
  unavailable: 'Unavailable',
};

const STATUS_ICONS: Record<PreferenceStatus, string> = {
  available: '✓',
  neutral: '○',
  unavailable: '✗',
};

// Trigger haptic feedback if available
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10);
  }
}

export function StatusToggle({ status, onToggle }: StatusToggleProps) {
  const handleClick = useCallback(() => {
    triggerHaptic();
    onToggle();
  }, [onToggle]);

  return (
    <button
      className={`status-toggle status-toggle--${status}`}
      onClick={handleClick}
      aria-label={`${STATUS_LABELS[status]}. Tap to change.`}
      type="button"
    >
      <span className="status-toggle__icon" aria-hidden="true">
        {STATUS_ICONS[status]}
      </span>
      <span className="status-toggle__label">
        {STATUS_LABELS[status]}
      </span>
    </button>
  );
}
