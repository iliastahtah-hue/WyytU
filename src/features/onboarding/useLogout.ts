import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

/** Déconnexion : on remet la présentation à zéro pour qu'elle se rejoue à la prochaine connexion, puis retour à l'accueil. */
export function useLogout() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { resetTuto } = useOnboarding();
  return useCallback(async () => {
    await resetTuto();
    await signOut();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  }, [resetTuto, signOut, router]);
}
