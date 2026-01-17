import { useMemo } from 'react';
import { useApp } from '../../store';
import { calculateCoverage, type CoverageCount, type WeekCoverage } from '../../domain/coverage';
import { ShiftGrid } from '../common';
import { DAYS, SHIFTS } from '../../types';
import './CoverageGrid.css';

function CoverageCell({ counts }: { counts: CoverageCount }) {
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
      <span className="count available">{counts.available}</span>
      <span className="count neutral">{counts.neutral}</span>
      <span className="count unavailable">{counts.unavailable}</span>
    </div>
  );
}

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
