import { useState, useCallback } from 'react'
import './App.css'
import { AuthProvider, useAuth } from './store/AuthContext'
import { useApp } from './store'
import { SupabaseAppProvider } from './store/SupabaseAppProvider'
import { AgentList, AddAgent } from './components/agents'
import { PreferenceGrid } from './components/grid'
import { CoverageGrid } from './components/coverage'
import { ScheduleGrid } from './components/schedule'
import { ViewTabs, type ViewType, DataActions, SaveErrorBanner } from './components/common'
import { MobileShell } from './components/mobile'
import { WorkspaceSelector, CreateWorkspace, InviteModal, PendingInvites, TeamManagement, ImportLocalData, hasLocalData } from './components/workspace'
import { LoginPage } from './components/auth'
import { useIsMobile, ConfirmProvider } from './hooks'

function DesktopContent() {
  const [activeView, setActiveView] = useState<ViewType>('schedule')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showTeamManagement, setShowTeamManagement] = useState(false)
  const { currentWorkspace, userRole } = useApp()
  const { user, refreshMemberships, signOut } = useAuth()

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
        {userRole === 'admin' && (
          <div className="workspace-actions">
            <button className="workspace-action-btn" onClick={() => setShowInviteModal(true)}>
              Invite
            </button>
            <button className="workspace-action-btn" onClick={() => setShowTeamManagement(true)}>
              Team
            </button>
          </div>
        )}
        <h2>Agents</h2>
        <AgentList onAgentSelect={handleAgentSelect} />
        <AddAgent onAgentAdd={handleAgentSelect} />
        <DataActions />
        <div className="sidebar-footer">
          <div className="user-info">{user?.email}</div>
          <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
        </div>
      </aside>
      <main className="main-content">
        <h1>ShapeShifter</h1>
        <ViewTabs activeView={activeView} onViewChange={setActiveView} />
        {renderView()}
      </main>

      {showInviteModal && (
        <InviteModal
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onClose={() => setShowInviteModal(false)}
          onInvitesSent={refreshMemberships}
        />
      )}

      {showTeamManagement && (
        <TeamManagement
          workspaceId={currentWorkspace.id}
          workspaceName={currentWorkspace.name}
          onClose={() => setShowTeamManagement(false)}
        />
      )}
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

function AuthenticatedApp() {
  const { user, loading, workspaceMemberships, pendingInvites, refreshMemberships, refreshInvites } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    )
  }

  // Not authenticated - show login
  if (!user) {
    return <LoginPage />
  }

  // Has pending invites and no workspaces - must handle invites first
  if (pendingInvites.length > 0 && workspaceMemberships.length === 0) {
    return (
      <PendingInvites
        invites={pendingInvites}
        onInviteHandled={() => {
          refreshMemberships();
          refreshInvites();
        }}
      />
    );
  }

  // No workspaces - check for local data to import, otherwise show create screen
  if (workspaceMemberships.length === 0) {
    if (hasLocalData()) {
      return <ImportLocalData onComplete={refreshMemberships} />
    }
    return <CreateWorkspace onWorkspaceCreated={refreshMemberships} />
  }

  // Has workspaces - show main app with the first workspace
  const initialWorkspaceId = workspaceMemberships[0].workspaceId

  return (
    <SupabaseAppProvider initialWorkspaceId={initialWorkspaceId}>
      <ConfirmProvider>
        <SaveErrorBanner />
        <AppContent />
      </ConfirmProvider>
    </SupabaseAppProvider>
  )
}

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
