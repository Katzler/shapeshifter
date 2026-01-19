import { useState, useCallback, useMemo } from 'react'
import './App.css'
import { AppProvider, useApp } from './store'
import { AgentList, AddAgent } from './components/agents'
import { PreferenceGrid } from './components/grid'
import { CoverageGrid } from './components/coverage'
import { ScheduleGrid } from './components/schedule'
import { ViewTabs, type ViewType, DataActions, SaveErrorBanner } from './components/common'
import { MobileShell } from './components/mobile'
import { WorkspaceSelector } from './components/workspace'
import { useIsMobile, ConfirmProvider } from './hooks'
import { calculateCoverage, getWeekCoverageSummary } from './domain'

function CoverageBanner() {
  const { agents } = useApp();

  const summary = useMemo(() => {
    if (agents.length === 0) return null;
    const coverage = calculateCoverage(agents);
    return getWeekCoverageSummary(coverage);
  }, [agents]);

  if (!summary) return null;

  const { gapShifts, tightShifts, totalShifts, gapDetails } = summary;

  if (gapShifts > 0) {
    const gapText = gapShifts === 1
      ? `1 gap: ${gapDetails[0].day} ${gapDetails[0].shift}`
      : gapShifts <= 3
        ? `${gapShifts} gaps: ${gapDetails.map(g => `${g.day} ${g.shift}`).join(', ')}`
        : `${gapShifts} gaps across the week`;
    return (
      <div className="coverage-banner coverage-banner--gap">
        <span className="coverage-banner__icon">!</span>
        <span className="coverage-banner__text">{gapText}</span>
      </div>
    );
  }

  if (tightShifts > 0) {
    return (
      <div className="coverage-banner coverage-banner--tight">
        <span className="coverage-banner__icon">~</span>
        <span className="coverage-banner__text">
          {tightShifts} shift{tightShifts !== 1 ? 's' : ''} with only neutral availability
        </span>
      </div>
    );
  }

  return (
    <div className="coverage-banner coverage-banner--covered">
      <span className="coverage-banner__icon">✓</span>
      <span className="coverage-banner__text">All {totalShifts} shifts covered</span>
    </div>
  );
}

function DesktopContent() {
  const [activeView, setActiveView] = useState<ViewType>('schedule')

  const handleAgentSelect = useCallback(() => {
    setActiveView('editor')
  }, [])

  const renderView = () => {
    switch (activeView) {
      case 'editor':
        return <PreferenceGrid />
      case 'coverage':
        return <CoverageGrid />
      case 'schedule':
        return <ScheduleGrid />
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Workspace</h2>
        <WorkspaceSelector />
        <h2>Agents</h2>
        <AgentList onAgentSelect={handleAgentSelect} />
        <AddAgent />
        <DataActions />
      </aside>
      <main className="main-content">
        <img src={`${import.meta.env.BASE_URL}shapeshifter_logo.svg`} alt="ShapeShifter" className="app-logo" />
        {activeView !== 'coverage' && <CoverageBanner />}
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {renderView()}
      </main>
    </div>
  )
}

function AppContent() {
  const isMobile = useIsMobile()

  if (isMobile) {
    return <MobileShell />
  }

  return <DesktopContent />
}

function App() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <SaveErrorBanner />
        <AppContent />
      </ConfirmProvider>
    </AppProvider>
  )
}

export default App
