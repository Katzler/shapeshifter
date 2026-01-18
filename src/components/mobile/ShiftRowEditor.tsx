import './ShiftRowEditor.css';
import { StatusToggle } from './StatusToggle';
import type { Shift, PreferenceStatus } from '../../types';

interface ShiftRowEditorProps {
  shift: Shift;
  status: PreferenceStatus;
  onToggle: () => void;
}

export function ShiftRowEditor({ shift, status, onToggle }: ShiftRowEditorProps) {
  return (
    <div className="shift-row-editor">
      <div className="shift-row-editor__info">
        <span className="shift-row-editor__label">{shift.label}</span>
        <span className="shift-row-editor__time">
          {shift.startTime} – {shift.endTime}
        </span>
      </div>
      <StatusToggle status={status} onToggle={onToggle} />
    </div>
  );
}
