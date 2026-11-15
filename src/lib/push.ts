import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Afficher les notifications même quand l'app est ouverte
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Enregistre le jeton push du téléphone pour l'utilisateur connecté.
 * Ne fait rien sur simulateur, sur le web, sans autorisation, ou tant que
 * le projet EAS n'est pas créé (`eas init` ajoute extra.eas.projectId).
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    if (!projectId) return;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'WyytU',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS as 'ios' | 'android' });
  } catch (e) {
    console.warn('[WyytU] push', e);
  }
}
