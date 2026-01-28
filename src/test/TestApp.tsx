/**
 * Test-only App component that uses localStorage provider.
 * This bypasses authentication for testing core UI functionality.
 */
import { useState, useCallback } from 'react';
import { AppProvider, useApp } from '../store';
import { AgentList, AddAgent } from '../components/agents';
import { PreferenceGrid } from '../components/grid';
import { CoverageGrid } from '../components/coverage';
import { ScheduleGrid } from '../components/schedule';
import { ViewTabs, type ViewType } from '../components/common';
import { ConfirmProvider } from '../hooks';

function TestAppContent() {
  const [activeView, setActiveView] = useState<ViewType>('schedule');
  const { currentWorkspace } = useApp();

  const handleAgentSelect = useCallback(() => {
    setActiveView('editor');
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'editor':
        return <PreferenceGrid />;
      case 'coverage':
        return <CoverageGrid />;
      case 'schedule':
        return <ScheduleGrid />;
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Workspace</h2>
        <div className="workspace-name">{currentWorkspace.name}</div>
        <h2>Agents</h2>
        <AgentList onAgentSelect={handleAgentSelect} />
        <AddAgent onAgentAdd={handleAgentSelect} />
      </aside>
      <main className="main-content">
        <h1>ShapeShifter</h1>
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {renderView()}
      </main>
    </div>
  );
}

export function TestApp() {
  return (
    <AppProvider>
      <ConfirmProvider>
        <TestAppContent />
      </ConfirmProvider>
    </AppProvider>
  );
}
