import './ViewTabs.css';

export type ViewType = 'editor' | 'coverage' | 'schedule';

interface ViewTabsProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function ViewTabs({ activeView, onViewChange }: ViewTabsProps) {
  return (
    <div className="view-tabs">
      <button
        className={`view-tab ${activeView === 'schedule' ? 'active' : ''}`}
        onClick={() => onViewChange('schedule')}
      >
        Schedule
      </button>
      <button
        className={`view-tab ${activeView === 'coverage' ? 'active' : ''}`}
        onClick={() => onViewChange('coverage')}
      >
        Coverage
      </button>
    </div>
  );
}
