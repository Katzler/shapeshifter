import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { supabaseWorkspaceService } from '../infrastructure/persistence/SupabaseWorkspaceService';

// Types for workspace membership info
export interface WorkspaceMembership {
  workspaceId: string;
  workspaceName: string;
  role: 'admin' | 'agent';
}

export interface PendingInvite {
  id: string;
  workspaceId: string;
  workspaceName: string;
  role: 'admin' | 'agent';
  invitedBy: string;
  invitedAt: string;
}

// Auth context value type
interface AuthContextValue {
  // State
  user: User | null;
  session: Session | null;
  loading: boolean;

  // User's workspaces and current role
  workspaceMemberships: WorkspaceMembership[];
  pendingInvites: PendingInvite[];
  currentRole: 'admin' | 'agent' | null;

  // Error states
  membershipsError: boolean;
  invitesError: boolean;

  // Actions
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshMemberships: () => Promise<void>;
  refreshInvites: () => Promise<void>;
  setCurrentRole: (role: 'admin' | 'agent') => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceMemberships, setWorkspaceMemberships] = useState<WorkspaceMembership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [currentRole, setCurrentRole] = useState<'admin' | 'agent' | null>(null);
  const [membershipsError, setMembershipsError] = useState(false);
  const [invitesError, setInvitesError] = useState(false);

  // Initialize session on mount
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Fetch workspace memberships when user changes
  const refreshMemberships = useCallback(async () => {
    if (!user?.email) {
      setWorkspaceMemberships([]);
      setMembershipsError(false);
      return;
    }

    try {
      const memberships = await supabaseWorkspaceService.getUserMemberships(user.email);
      setMembershipsError(false);
      setWorkspaceMemberships(memberships);
    } catch (err) {
      console.error('Failed to fetch memberships:', err);
      setMembershipsError(true);
    }
  }, [user?.email]);

  // Fetch pending invites when user changes
  const refreshInvites = useCallback(async () => {
    if (!user?.email) {
      setPendingInvites([]);
      setInvitesError(false);
      return;
    }

    try {
      const invites = await supabaseWorkspaceService.getUserPendingInvites(user.email);
      setInvitesError(false);
      setPendingInvites(invites);
    } catch (err) {
      console.error('Failed to fetch invites:', err);
      setInvitesError(true);
    }
  }, [user?.email]);

  // Refresh memberships and invites when user changes
  useEffect(() => {
    if (user) {
      refreshMemberships();
      refreshInvites();
    }
  }, [user, refreshMemberships, refreshInvites]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setWorkspaceMemberships([]);
    setPendingInvites([]);
    setCurrentRole(null);
    setMembershipsError(false);
    setInvitesError(false);
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    workspaceMemberships,
    pendingInvites,
    currentRole,
    membershipsError,
    invitesError,
    signInWithGoogle,
    signOut,
    refreshMemberships,
    refreshInvites,
    setCurrentRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use the auth context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
