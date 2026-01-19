import type { ReactNode } from 'react';
import { DAYS, SHIFTS } from '../../types';
import type { DayOfWeek, ShiftId } from '../../types';
import './ShiftGrid.css';

interface ShiftGridProps {
  /** CSS class name for the grid container */
  className?: string;
  /** Render function for each cell in the grid */
  renderCell: (day: DayOfWeek, shift: ShiftId) => ReactNode;
}

/**
 * Shared grid layout component for shift-based displays.
 * Renders day headers, shift headers with times, and cells via render prop.
 *
 * Used by: PreferenceGrid, ScheduleGrid, CoverageGrid
 */
export function ShiftGrid({ className = '', renderCell }: ShiftGridProps) {
  return (
    <div className={`shift-grid ${className}`}>
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
          <div
            key={`${shift.id}-header`}
            className="grid-cell grid-header shift-header"
          >
            <span className="shift-time">
              {shift.startTime}–{shift.endTime}
            </span>
          </div>

          {/* Cells for this shift */}
          {DAYS.map((day) => (
            <div key={`${shift.id}-${day.id}`} className="grid-cell-wrapper">
              {renderCell(day.id, shift.id)}
            </div>
          ))}
        </>
      ))}
    </div>
  );
}
