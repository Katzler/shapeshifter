import './CoverageStrip.css';
import { CoverageStatusCell } from './CoverageStatusCell';
import { DAYS, type DayOfWeek } from '../../types';
import type { CoverageStatus, WeekCoverage } from '../../domain';
import { getDayCoverageStatus } from '../../domain';

interface CoverageStripProps {
  coverage: WeekCoverage;
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
}

export function CoverageStrip({ coverage, selectedDay, onDaySelect }: CoverageStripProps) {
  return (
    <div className="coverage-strip">
      {DAYS.map((day) => {
        const dayStatus: CoverageStatus = getDayCoverageStatus(coverage[day.id]);
        return (
          <CoverageStatusCell
            key={day.id}
            day={day.id}
            label={day.label}
            status={dayStatus}
            isSelected={selectedDay === day.id}
            onClick={onDaySelect}
          />
        );
      })}
    </div>
  );
}
