import { useMemo } from 'react';
import { useApp } from '../../store';
import { calculateCoverage, type CoverageCount } from '../../domain/coverage';
import { ShiftGrid } from '../common';
import './CoverageGrid.css';

function CoverageCell({ counts }: { counts: CoverageCount }) {
  const hasGap = counts.available === 0;
  const hasCoverage = counts.available > 0;
  const cellClass = hasGap ? 'coverage-gap' : hasCoverage ? 'coverage-ok' : '';

  return (
    <div className={`coverage-cell ${cellClass}`}>
      <span className="count available">{counts.available}</span>
      <span className="count unavailable">{counts.unavailable}</span>
      <span className="count neutral">{counts.neutral}</span>
    </div>
  );
}

export function CoverageGrid() {
  const { agents } = useApp();

  const coverage = useMemo(() => calculateCoverage(agents), [agents]);

  return (
    <div className="coverage-grid-container">
      <h2 className="coverage-grid-title">Coverage Summary</h2>

      <div className="coverage-legend">
        <span className="legend-item">
          <span className="legend-dot available" />
          Available
        </span>
        <span className="legend-item">
          <span className="legend-dot unavailable" />
          Unavailable
        </span>
        <span className="legend-item">
          <span className="legend-dot neutral" />
          Neutral
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
    </div>
  );
}
