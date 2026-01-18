import './BottomTabBar.css';

export type MobileTab = 'schedule' | 'availability' | 'coverage';

interface TabConfig {
  id: MobileTab;
  label: string;
  icon: string;
}

const TABS: TabConfig[] = [
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'availability', label: 'Availability', icon: '✋' },
  { id: 'coverage', label: 'Coverage', icon: '📊' },
];

interface BottomTabBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <nav className="bottom-tab-bar" role="tablist" aria-label="Main navigation">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`bottom-tab-bar__tab ${activeTab === tab.id ? 'bottom-tab-bar__tab--active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-label={tab.label}
        >
          <span className="bottom-tab-bar__icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span className="bottom-tab-bar__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
