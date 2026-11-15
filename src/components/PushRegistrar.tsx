import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { registerForPush } from '@/src/lib/push';
import { useAuth } from '@/src/providers/AuthProvider';
import { useOnboarding } from '@/src/providers/OnboardingProvider';

/** Enregistre l'appareil et ouvre le bon écran quand on touche une notification. */
export function PushRegistrar() {
  const router = useRouter();
  const { session, profile } = useAuth();
  const { permissionsDone } = useOnboarding();

  useEffect(() => {
    if (session && profile && permissionsDone) registerForPush();
  }, [session, profile, permissionsDone]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; group_id?: string | null };
      if (!data?.group_id) return router.push('/notifications');
      if (data.type === 'no_show') router.push({ pathname: '/contester/[id]', params: { id: data.group_id } });
      else router.push({ pathname: '/groupe/[id]', params: { id: data.group_id } });
    });
    return () => sub.remove();
  }, [router]);

  return null;
}
