import { useMemo, memo, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../store';
import { calculateCoverage, type CoverageCount, type WeekCoverage } from '../../domain/coverage';
import { ShiftGrid } from '../common';
import { DAYS, SHIFTS } from '../../types';
import './CoverageGrid.css';

interface TooltipPosition {
  top: number;
  left: number;
}

interface CountWithTooltipProps {
  count: number;
  agents: string[];
  className: string;
}

const CountWithTooltip = memo(function CountWithTooltip({
  count,
  agents,
  className,
}: CountWithTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<TooltipPosition>({ top: 0, left: 0 });
  const spanRef = useRef<HTMLSpanElement>(null);

  const showTooltip = useCallback(() => {
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 8,
        left: rect.left + rect.width / 2,
      });
    }
    setIsVisible(true);
  }, []);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  }, [isVisible, showTooltip, hideTooltip]);

  if (count === 0) {
    return <span className={`count ${className}`}>{count}</span>;
  }

  const tooltipText = agents.join(', ');

  return (
    <>
      <span
        ref={spanRef}
        className={`count ${className} has-tooltip`}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={handleClick}
        tabIndex={0}
        onBlur={hideTooltip}
      >
        {count}
      </span>
      {isVisible &&
        createPortal(
          <div
            className="coverage-tooltip"
            style={{
              top: position.top,
              left: position.left,
              transform: 'translate(-50%, -100%)',
            }}
          >
            {tooltipText}
          </div>,
          document.body
        )}
    </>
  );
});

const CoverageCell = memo(function CoverageCell({ counts }: { counts: CoverageCount }) {
  // Three-state coverage: green (preferred), amber (neutral only), red (gap)
  const hasPreferred = counts.available > 0;
  const hasNeutral = counts.neutral > 0;
  const hasGap = !hasPreferred && !hasNeutral;

  let cellClass = '';
  if (hasPreferred) {
    cellClass = 'coverage-ok';
  } else if (hasNeutral) {
    cellClass = 'coverage-neutral';
  } else if (hasGap) {
    cellClass = 'coverage-gap';
  }

  return (
    <div className={`coverage-cell ${cellClass}`}>
      <CountWithTooltip count={counts.available} agents={counts.availableAgents} className="available" />
      <CountWithTooltip count={counts.neutral} agents={counts.neutralAgents} className="neutral" />
      <CountWithTooltip count={counts.unavailable} agents={counts.unavailableAgents} className="unavailable" />
    </div>
  );
});

function hasAnyAvailability(coverage: WeekCoverage): boolean {
  for (const day of DAYS) {
    for (const shift of SHIFTS) {
      const counts = coverage[day.id][shift.id];
      if (counts.available > 0 || counts.neutral > 0) {
        return true;
      }
    }
  }
  return false;
}

export function CoverageGrid() {
  const { agents } = useApp();

  const coverage = useMemo(() => calculateCoverage(agents), [agents]);
  const anyAvailability = useMemo(() => hasAnyAvailability(coverage), [coverage]);

  const showNoAvailabilityNote = agents.length > 0 && !anyAvailability;

  return (
    <div className="coverage-grid-container">
      <h2 className="coverage-grid-title">Coverage Summary</h2>

      <div className="coverage-legend">
        <span className="legend-item">
          <span className="legend-dot available" />
          Available
        </span>
        <span className="legend-item">
          <span className="legend-dot neutral" />
          Neutral
        </span>
        <span className="legend-item">
          <span className="legend-dot unavailable" />
          Unavailable
        </span>
      </div>

      <ShiftGrid
        className="coverage-grid"
        renderCell={(day, shift) => (
          <CoverageCell counts={coverage[day][shift]} />
        )}
      />

      {agents.length === 0 && (
        <p className="coverage-empty-note">Add agents to see coverage data.</p>
      )}

      {showNoAvailabilityNote && (
        <p className="coverage-empty-note">
          No availability set. Select an agent to open their shifts.
        </p>
      )}
    </div>
  );
}
