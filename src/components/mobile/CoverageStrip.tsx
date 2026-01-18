import './CoverageStrip.css';
import { CoverageStatusCell } from './CoverageStatusCell';
import { DAYS, type DayOfWeek } from '../../types';
import type { CoverageStatus, WeekCoverage } from '../../domain';
import { getDayCoverageStatus } from '../../domain';

// Get current day of week as DayOfWeek
function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return mapping[dayIndex];
}

interface CoverageStripProps {
  coverage: WeekCoverage;
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
}

export function CoverageStrip({ coverage, selectedDay, onDaySelect }: CoverageStripProps) {
  const today = getTodayDayOfWeek();

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
            isToday={today === day.id}
            onClick={onDaySelect}
          />
        );
      })}
    </div>
  );
}
