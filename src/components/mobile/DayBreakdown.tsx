import './DayBreakdown.css';
import { ShiftCoverageRow } from './ShiftCoverageRow';
import { SHIFTS, DAYS, type DayOfWeek } from '../../types';
import type { ShiftCoverage } from '../../domain';
import { getShiftCoverageStatus } from '../../domain';

interface DayBreakdownProps {
  day: DayOfWeek;
  shiftCoverage: ShiftCoverage;
}

export function DayBreakdown({ day, shiftCoverage }: DayBreakdownProps) {
  const dayLabel = DAYS.find((d) => d.id === day)?.label ?? day;

  return (
    <div className="day-breakdown">
      <div className="day-breakdown__header">
        <h2 className="day-breakdown__title">{dayLabel}</h2>
      </div>
      <div className="day-breakdown__shifts">
        {SHIFTS.map((shift) => {
          const counts = shiftCoverage[shift.id];
          const status = getShiftCoverageStatus(counts);
          return (
            <ShiftCoverageRow
              key={shift.id}
              shift={shift}
              status={status}
            />
          );
        })}
      </div>
    </div>
  );
}
