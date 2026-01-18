import { useState, useCallback } from 'react'
import './App.css'
import { AppProvider } from './store'
import { AgentList, AddAgent } from './components/agents'
import { PreferenceGrid } from './components/grid'
import { CoverageGrid } from './components/coverage'
import { ScheduleGrid } from './components/schedule'
import { ViewTabs, type ViewType, DataActions, SaveErrorBanner } from './components/common'
import { MobileShell } from './components/mobile'
import { useIsMobile } from './hooks'

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
        <h2>Agents</h2>
        <AgentList onAgentSelect={handleAgentSelect} />
        <AddAgent />
        <DataActions />
      </aside>
      <main className="main-content">
        <h1>ShapeShifter</h1>
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
      <SaveErrorBanner />
      <AppContent />
    </AppProvider>
  )
}

export default App
