import { useState } from 'react'
import './App.css'
import { AppProvider } from './store'
import { AgentList, AddAgent } from './components/agents'
import { PreferenceGrid } from './components/grid'
import { CoverageGrid } from './components/coverage'
import { ViewTabs, type ViewType, DataActions } from './components/common'

function AppContent() {
  const [activeView, setActiveView] = useState<ViewType>('editor')

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Agents</h2>
        <AgentList />
        <AddAgent />
        <DataActions />
      </aside>
      <main className="main-content">
        <h1>ShapeShifter</h1>
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {activeView === 'editor' ? <PreferenceGrid /> : <CoverageGrid />}
      </main>
    </div>
  )
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  )
}

export default App
