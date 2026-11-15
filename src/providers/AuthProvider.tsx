import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Profile } from '@/src/lib/database.types';
import { supabase } from '@/src/lib/supabase';

type AuthValue = {
  session: Session | null;
  profile: Profile | null;
  /** true tant que la session et le profil ne sont pas encore chargés */
  loading: boolean;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  // id de l'utilisateur dont le profil est chargé (évite un mauvais routage
  // pendant le court instant où la session existe mais pas encore le profil)
  const [profileFor, setProfileFor] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setProfileFor(null);
      return null;
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) console.warn('[WyytU] profil', error.message);
    setProfile(data ?? null);
    setProfileFor(userId);
    return data ?? null;
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      await loadProfile(data.session?.user.id);
      if (mounted) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      // Chargement du profil hors du callback (recommandation Supabase)
      setTimeout(() => {
        loadProfile(next?.user.id);
      }, 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const refreshProfile = useCallback(() => loadProfile(session?.user.id), [loadProfile, session?.user.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const busy = loading || (!!session && profileFor !== session.user.id);

  const value = useMemo(
    () => ({ session, profile, loading: busy, refreshProfile, signOut }),
    [session, profile, busy, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>');
  return ctx;
}
