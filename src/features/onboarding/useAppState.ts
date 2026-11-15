import { useI18n } from '@/src/i18n';
import { useAuth } from '@/src/providers/AuthProvider';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

/** Regroupe l'état utile au routage d'accueil. */
export function useAppState() {
  const { lang, ready: langReady } = useI18n();
  const { session, profile, loading } = useAuth();
  const { tutoDone, permissionsDone, ready: obReady } = useOnboarding();
  return {
    ready: langReady && obReady && !loading,
    state: { lang, tutoDone, session, profile, permissionsDone },
  };
}
