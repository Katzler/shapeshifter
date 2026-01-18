import { useRef, useEffect, useCallback } from 'react';
import './DayPickerStrip.css';
import { DayCell } from './DayCell';
import { DAYS, type DayOfWeek } from '../../types';
import { getTodayDayOfWeek } from '../../utils';

interface DayPickerStripProps {
  selectedDay: DayOfWeek;
  onDaySelect: (day: DayOfWeek) => void;
}

export function DayPickerStrip({ selectedDay, onDaySelect }: DayPickerStripProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const today = getTodayDayOfWeek();
  const isSelectedToday = selectedDay === today;

  const handleTodayClick = useCallback(() => {
    onDaySelect(today);
  }, [onDaySelect, today]);

  // Scroll selected day into view on mount and when selection changes
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const selectedElement = container.querySelector(`[data-day="${selectedDay}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  }, [selectedDay]);

  return (
    <div className="day-picker-strip">
      <div className="day-picker-strip__days" ref={scrollContainerRef}>
        {DAYS.map((day) => (
          <div key={day.id} data-day={day.id}>
            <DayCell
              day={day.id}
              label={day.label}
              isSelected={selectedDay === day.id}
              isToday={today === day.id}
              onClick={onDaySelect}
            />
          </div>
        ))}
      </div>
      {!isSelectedToday && (
        <button
          className="day-picker-strip__today-pill"
          onClick={handleTodayClick}
          aria-label="Go to today"
        >
          Today
        </button>
      )}
    </div>
  );
}
