import './MobileCoverageView.css';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { CoverageStrip } from './CoverageStrip';
import { DayBreakdown } from './DayBreakdown';
import { useApp } from '../../store';
import { calculateCoverage, getDayCoverageStatus } from '../../domain';
import { DAYS, type DayOfWeek } from '../../types';

export function MobileCoverageView() {
  const { agents } = useApp();
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon');

  const coverage = useMemo(() => calculateCoverage(agents), [agents]);

  // Find first day with issues (gap > tight > covered), or default to Monday
  const findFirstProblemDay = useCallback((): DayOfWeek => {
    // First pass: find any gap
    for (const day of DAYS) {
      const status = getDayCoverageStatus(coverage[day.id]);
      if (status === 'gap') return day.id;
    }
    // Second pass: find any tight
    for (const day of DAYS) {
      const status = getDayCoverageStatus(coverage[day.id]);
      if (status === 'tight') return day.id;
    }
    // All covered, default to Monday
    return 'mon';
  }, [coverage]);

  // Auto-select first problem day when coverage changes
  useEffect(() => {
    setSelectedDay(findFirstProblemDay());
  }, [findFirstProblemDay]);

  const handleDaySelect = useCallback((day: DayOfWeek) => {
    setSelectedDay(day);
  }, []);

  // Empty state: no agents
  if (agents.length === 0) {
    return (
      <div className="mobile-coverage-view">
        <div className="mobile-coverage-view__empty">
          <p className="mobile-coverage-view__empty-title">No agents yet</p>
          <p className="mobile-coverage-view__empty-hint">
            Add agents on desktop to see coverage data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-coverage-view">
      <div className="mobile-coverage-view__header">
        <h2 className="mobile-coverage-view__title">Week Overview</h2>
        <p className="mobile-coverage-view__subtitle">Tap a day to see details</p>
      </div>

      <CoverageStrip
        coverage={coverage}
        selectedDay={selectedDay}
        onDaySelect={handleDaySelect}
      />

      <DayBreakdown
        day={selectedDay}
        shiftCoverage={coverage[selectedDay]}
      />

      <div className="mobile-coverage-view__legend">
        <div className="mobile-coverage-view__legend-item">
          <span className="mobile-coverage-view__legend-icon mobile-coverage-view__legend-icon--covered">✓</span>
          <span>Covered</span>
        </div>
        <div className="mobile-coverage-view__legend-item">
          <span className="mobile-coverage-view__legend-icon mobile-coverage-view__legend-icon--tight">~</span>
          <span>Tight</span>
        </div>
        <div className="mobile-coverage-view__legend-item">
          <span className="mobile-coverage-view__legend-icon mobile-coverage-view__legend-icon--gap">!</span>
          <span>Gap</span>
        </div>
      </div>
    </div>
  );
}
