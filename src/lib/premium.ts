import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '@/src/providers/AuthProvider';

export type PremiumFeature = 'save' | 'unlimited' | 'filters' | 'boost';

/**
 * Renvoie une fonction à appeler avant une action Premium :
 * true si l'utilisateur est Premium, sinon ouvre la page d'abonnement et renvoie false.
 */
export function usePremiumGate() {
  const router = useRouter();
  const { profile } = useAuth();
  return useCallback(
    (feature: PremiumFeature) => {
      if (profile?.is_premium) return true;
      router.push({ pathname: '/premium', params: { feature } });
      return false;
    },
    [profile?.is_premium, router],
  );
}
