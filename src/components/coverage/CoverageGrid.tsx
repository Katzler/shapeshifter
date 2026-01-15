import { useMemo } from 'react';
import { useApp } from '../../store';
import { DAYS, SHIFTS } from '../../types';
import { calculateCoverage, type CoverageCount } from './calculateCoverage';
import './CoverageGrid.css';

function CoverageCell({ counts }: { counts: CoverageCount }) {
  const hasGap = counts.available === 0;

  return (
    <div className={`coverage-cell ${hasGap ? 'coverage-gap' : ''}`}>
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

      <div className="coverage-grid">
        {/* Empty corner cell */}
        <div className="grid-cell grid-corner" />

        {/* Day headers */}
        {DAYS.map((day) => (
          <div key={day.id} className="grid-cell grid-header day-header">
            {day.label.slice(0, 3)}
          </div>
        ))}

        {/* Shift rows */}
        {SHIFTS.map((shift) => (
          <>
            {/* Shift header */}
            <div key={`${shift.id}-header`} className="grid-cell grid-header shift-header">
              <span className="shift-label">{shift.label}</span>
              <span className="shift-time">
                {shift.startTime}–{shift.endTime}
              </span>
            </div>

            {/* Coverage cells for this shift */}
            {DAYS.map((day) => (
              <CoverageCell
                key={`${shift.id}-${day.id}`}
                counts={coverage[day.id][shift.id]}
              />
            ))}
          </>
        ))}
      </div>

      {agents.length === 0 && (
        <p className="coverage-empty-note">Add agents to see coverage data.</p>
      )}
    </div>
  );
}
