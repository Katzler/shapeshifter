import { useState, useCallback, useEffect, useMemo } from 'react';
import './MobileShell.css';
import { BottomTabBar, type MobileTab } from './BottomTabBar';
import { DayPickerStrip } from './DayPickerStrip';
import { MobileEditorView } from './MobileEditorView';
import { MobileScheduleView } from './MobileScheduleView';
import { MobileCoverageView } from './MobileCoverageView';
import { MobileSwapsView } from './MobileSwapsView';
import { MobileWorkspacePicker, MobileWorkspaceTrigger } from './MobileWorkspacePicker';
import { useApp } from '../../store';
import type { DayOfWeek } from '../../types';
import { calculateCoverage, getWeekCoverageSummary } from '../../domain';
import { getTodayDayOfWeek } from '../../utils';

function MobileCoverageBanner({ onTapGaps }: { onTapGaps: () => void }) {
  const { agents } = useApp();

  const summary = useMemo(() => {
    if (agents.length === 0) return null;
    const coverage = calculateCoverage(agents);
    return getWeekCoverageSummary(coverage);
  }, [agents]);

  if (!summary) return null;

  const { gapShifts, tightShifts, totalShifts } = summary;

  if (gapShifts > 0) {
    return (
      <button className="mobile-coverage-banner mobile-coverage-banner--gap" onClick={onTapGaps}>
        <span className="mobile-coverage-banner__icon">!</span>
        <span className="mobile-coverage-banner__text">
          {gapShifts} gap{gapShifts !== 1 ? 's' : ''} need attention
        </span>
      </button>
    );
  }

  if (tightShifts > 0) {
    return (
      <div className="mobile-coverage-banner mobile-coverage-banner--tight">
        <span className="mobile-coverage-banner__icon">~</span>
        <span className="mobile-coverage-banner__text">
          {tightShifts} shift{tightShifts !== 1 ? 's' : ''} tight
        </span>
      </div>
    );
  }

  return (
    <div className="mobile-coverage-banner mobile-coverage-banner--covered">
      <span className="mobile-coverage-banner__icon">✓</span>
      <span className="mobile-coverage-banner__text">All {totalShifts} shifts covered</span>
    </div>
  );
}

export function MobileShell() {
  const { agents } = useApp();
  const [activeTab, setActiveTab] = useState<MobileTab>('coverage');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getTodayDayOfWeek);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isWorkspacePickerOpen, setIsWorkspacePickerOpen] = useState(false);

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

  // Day picker is shown for Schedule and Availability tabs
  const showDayPicker = activeTab === 'schedule' || activeTab === 'availability';
  // Banner is shown on Schedule and Availability tabs
  const showCoverageBanner = activeTab === 'schedule' || activeTab === 'availability';

  const handleBannerTap = useCallback(() => {
    setActiveTab('coverage');
  }, []);

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
      case 'swaps':
        return <MobileSwapsView />;
    }
  };

  return (
    <div className="mobile-shell">
      <header className="mobile-shell__header">
        <MobileWorkspaceTrigger onClick={() => setIsWorkspacePickerOpen(true)} />
      </header>

      <MobileWorkspacePicker
        isOpen={isWorkspacePickerOpen}
        onClose={() => setIsWorkspacePickerOpen(false)}
      />

      {showCoverageBanner && <MobileCoverageBanner onTapGaps={handleBannerTap} />}

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
