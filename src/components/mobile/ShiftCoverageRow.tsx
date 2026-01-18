import './ShiftCoverageRow.css';
import { StatusBadge } from './StatusBadge';
import type { Shift } from '../../types';
import type { CoverageStatus } from '../../domain';

interface ShiftCoverageRowProps {
  shift: Shift;
  status: CoverageStatus;
}

export function ShiftCoverageRow({ shift, status }: ShiftCoverageRowProps) {
  return (
    <div className="shift-coverage-row">
      <div className="shift-coverage-row__info">
        <span className="shift-coverage-row__label">{shift.label}</span>
        <span className="shift-coverage-row__time">
          {shift.startTime} – {shift.endTime}
        </span>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}
