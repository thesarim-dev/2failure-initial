import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { formatOAuthError } from '../lib/authErrors';
import { readStoredLanguage } from '../lib/persistedSettings';
import { translations } from '../i18n/translations';
import { supabase } from '../lib/supabase';
import { identify, resetAnalytics, track } from '../lib/analytics';

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  authError: string | null;
  refreshSession: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Signed in anonymously ("Try it first"); progress can be saved to an account later. */
  isGuest: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      setSession((prev) => {
        const wasGuest = !!prev?.user?.is_anonymous;
        const user = nextSession?.user;
        if (user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          identify(user.id, { guest: !!user.is_anonymous });
          if (event === 'SIGNED_IN') track('signed_in', { guest: !!user.is_anonymous });
        }
        if (event === 'USER_UPDATED' && wasGuest && user && !user.is_anonymous) {
          identify(user.id, { guest: false });
          track('guest_upgraded');
        }
        if (event === 'SIGNED_OUT') resetAnalytics();
        return nextSession;
      });
      setLoading(false);
    });

    const bootstrapAuth = async () => {
      try {
        setAuthError(null);

        const params = new URLSearchParams(window.location.search);
        const oauthError =
          params.get('error_description') ?? params.get('error');
        const code = params.get('code');

        if (oauthError || code) {
          window.history.replaceState({}, '', window.location.pathname);
        }

        if (oauthError) {
          const raw = decodeURIComponent(oauthError.replace(/\+/g, ' '));
          throw new Error(formatOAuthError(raw, readStoredLanguage()));
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        }

        const {
          data: { session: currentSession },
          error
        } = await supabase.auth.getSession();

        if (error) throw error;
        if (!mounted) return;

        setSession(currentSession);
      } catch (err) {
        if (!mounted) return;
        setAuthError(
          err instanceof Error
            ? err.message
            : translations[readStoredLanguage()].login.errors.restoreSession
        );
        setSession(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void bootstrapAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshSession = useCallback(async () => {
    const {
      data: { session: currentSession },
      error
    } = await supabase.auth.getSession();
    if (error) throw error;
    setSession(currentSession);
    setLoading(false);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      authError,
      refreshSession,
      signOut,
      isGuest: !!session?.user?.is_anonymous
    }),
    [session, loading, authError, refreshSession, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
