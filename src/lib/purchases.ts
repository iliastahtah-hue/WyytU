import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import Purchases, { type PurchasesPackage } from 'react-native-purchases';

/**
 * Abonnement Premium via RevenueCat (App Store / Google Play).
 * - Clés publiques RevenueCat dans .env (EXPO_PUBLIC_REVENUECAT_IOS_KEY / _ANDROID_KEY).
 * - Ne fonctionne que dans une version compilée (EAS), pas dans Expo Go ni sur le web.
 * - Le statut Premium côté serveur est mis à jour par la fonction
 *   `revenuecat-webhook` (profiles.is_premium), jamais par l'app elle-même.
 */
const KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
});

let configuredFor: string | null = null;

export function purchasesAvailable() {
  return !!KEY && Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

export async function configurePurchases(userId: string) {
  if (!purchasesAvailable() || configuredFor === userId) return;
  if (configuredFor) await Purchases.logIn(userId);
  else Purchases.configure({ apiKey: KEY as string, appUserID: userId });
  configuredFor = userId;
}

export async function getMonthlyPackage(): Promise<PurchasesPackage | null> {
  if (!purchasesAvailable()) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current?.monthly ?? offerings.current?.availablePackages[0] ?? null;
}

/** true si l'achat a abouti (l'utilisateur peut annuler : renvoie false) */
export async function buy(pkg: PurchasesPackage): Promise<boolean> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active.premium;
  } catch (e) {
    if ((e as { userCancelled?: boolean }).userCancelled) return false;
    throw e;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return !!info.entitlements.active.premium;
}
