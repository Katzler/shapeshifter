import './ShiftListEditor.css';
import { useCallback } from 'react';
import { ShiftRowEditor } from './ShiftRowEditor';
import { SHIFTS, type DayOfWeek, type ShiftId, type DayPreferences } from '../../types';

interface ShiftListEditorProps {
  day: DayOfWeek;
  preferences: DayPreferences;
  onCyclePreference: (day: DayOfWeek, shift: ShiftId) => void;
}

export function ShiftListEditor({ day, preferences, onCyclePreference }: ShiftListEditorProps) {
  const handleToggle = useCallback(
    (shiftId: ShiftId) => {
      onCyclePreference(day, shiftId);
    },
    [day, onCyclePreference]
  );

  return (
    <div className="shift-list-editor">
      {SHIFTS.map((shift) => (
        <ShiftRowEditor
          key={shift.id}
          shift={shift}
          status={preferences[shift.id]}
          onToggle={() => handleToggle(shift.id)}
        />
      ))}
    </div>
  );
}
