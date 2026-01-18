import './GapIndicator.css';

export function GapIndicator() {
  return (
    <div className="gap-indicator" role="status">
      <span className="gap-indicator__icon" aria-hidden="true">!</span>
      <span className="gap-indicator__text">Unassigned</span>
    </div>
  );
}
