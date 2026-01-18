import { useState, useCallback, useEffect } from 'react';
import './MobileShell.css';
import { BottomTabBar, type MobileTab } from './BottomTabBar';
import { DayPickerStrip } from './DayPickerStrip';
import { MobileEditorView } from './MobileEditorView';
import { MobileScheduleView } from './MobileScheduleView';
import { MobileCoverageView } from './MobileCoverageView';
import { useApp } from '../../store';
import type { DayOfWeek } from '../../types';

// Get current day of week as DayOfWeek
function getTodayDayOfWeek(): DayOfWeek {
  const dayIndex = new Date().getDay();
  const mapping: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return mapping[dayIndex];
}

export function MobileShell() {
  const { agents } = useApp();
  const [activeTab, setActiveTab] = useState<MobileTab>('coverage');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  // Auto-select first agent when agents change and none is selected
  useEffect(() => {
    if (selectedAgentId === null && agents.length > 0) {
      setSelectedAgentId(agents[0].id);
    }
    // Clear selection if selected agent was deleted
    if (selectedAgentId && !agents.find((a) => a.id === selectedAgentId)) {
      setSelectedAgentId(agents.length > 0 ? agents[0].id : null);
    }
  }, [agents, selectedAgentId]);

  const handleTabChange = useCallback((tab: MobileTab) => {
    setActiveTab(tab);
  }, []);

  const handleDaySelect = useCallback((day: DayOfWeek) => {
    setSelectedDay(day);
  }, []);

  const handleAgentSelect = useCallback((agentId: string) => {
    setSelectedAgentId(agentId);
  }, []);

  // Day picker is shown for Schedule and Availability tabs, not Coverage
  const showDayPicker = activeTab !== 'coverage';

  const renderContent = () => {
    switch (activeTab) {
      case 'availability':
        return (
          <MobileEditorView
            selectedDay={selectedDay}
            selectedAgentId={selectedAgentId}
            onAgentSelect={handleAgentSelect}
          />
        );
      case 'schedule':
        return <MobileScheduleView selectedDay={selectedDay} />;
      case 'coverage':
        return <MobileCoverageView />;
    }
  };

  return (
    <div className="mobile-shell">
      <header className="mobile-shell__header">
        <h1 className="mobile-shell__title">ShapeShifter</h1>
      </header>

      {showDayPicker && (
        <DayPickerStrip
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
      )}

      <main className="mobile-shell__content">
        {renderContent()}
      </main>

      <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
    </div>
  );
}
