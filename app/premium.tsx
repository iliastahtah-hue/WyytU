import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { buy, configurePurchases, getMonthlyPackage, purchasesAvailable, restore } from '@/src/lib/purchases';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius } from '@/src/theme/tokens';

const PERKS = [
  ['🎟️', 'Groupes illimités', 'Crée autant de sorties que tu veux (2 par semaine en gratuit).'],
  ['🚀', 'Tes sorties en avant', 'Tes groupes apparaissent en premier dans Explorer.'],
  ['🎯', 'Filtres avancés', 'Note minimale, profils vérifiés uniquement, quartier.'],
  ['⭐', 'Badge Premium', 'Un petit badge sur ton profil.'],
];

export default function PremiumScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [busy, setBusy] = useState(false);
  const available = purchasesAvailable();

  useEffect(() => {
    if (!available || !session) return;
    configurePurchases(session.user.id)
      .then(getMonthlyPackage)
      .then(setPkg)
      .catch(() => setPkg(null));
  }, [available, session]);

  const price = pkg?.product.priceString ?? '[PRIX] DH';

  const notYet = () =>
    Alert.alert('Bientôt disponible', 'L’abonnement Premium sera disponible dans la version publiée sur l’App Store et Google Play.');

  const onBuy = async () => {
    if (!pkg) return notYet();
    setBusy(true);
    try {
      if (await buy(pkg)) {
        // le serveur active Premium via le webhook RevenueCat (quelques secondes)
        setTimeout(refreshProfile, 4000);
        Alert.alert('Bienvenue dans Premium ⭐', 'Ton abonnement est actif.');
      }
    } catch (e) {
      Alert.alert(readableError(e, 'L’achat n’a pas pu aboutir.'));
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!available) return notYet();
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? 'Achats restaurés ✓' : 'Aucun abonnement trouvé', ok ? 'Premium est de nouveau actif.' : 'Aucun achat lié à ce compte store.');
      if (ok) setTimeout(refreshProfile, 4000);
    } catch (e) {
      Alert.alert(readableError(e, 'Impossible de restaurer les achats.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        profile?.is_premium ? (
          <Button kind="lime" label="⭐ Tu es Premium" disabled />
        ) : (
          <>
            <Button label="Essayer 7 jours gratuits" onPress={onBuy} loading={busy} />
            <Button kind="ghost" label="Restaurer mes achats" onPress={onRestore} disabled={busy} />
          </>
        )
      }
    >
      <TopBar title="Premium" />
      <View style={styles.hero}>
        <Image source={img3d.star} style={{ width: 88, height: 88 }} />
        <AppText variant="display" center>WyytU Premium</AppText>
        <AppText variant="bodyStrong" center>{price} / mois après 7 jours gratuits</AppText>
      </View>
      <View style={{ gap: 10 }}>
        {PERKS.map(([e, title, body]) => (
          <View key={title} style={styles.perk}>
            <AppText style={{ fontSize: 26 }}>{e}</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{title}</AppText>
              <AppText variant="small" color={colors.sub}>{body}</AppText>
            </View>
          </View>
        ))}
      </View>
      <AppText variant="small" color={colors.sub} style={{ marginTop: 16 }}>
        Abonnement mensuel à renouvellement automatique ({price} par mois après l’essai gratuit de 7 jours), facturé sur ton compte App Store ou Google Play. Il se renouvelle sauf résiliation au moins 24 h avant la fin de la période en cours. Tu peux le gérer ou le résilier à tout moment dans les réglages de ton compte du store.
      </AppText>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <AppText variant="small" color={colors.coralDark} onPress={() => Linking.openURL('https://wyytu.app/cgu')}>Conditions d’utilisation</AppText>
        <AppText variant="small" color={colors.coralDark} onPress={() => Linking.openURL('https://wyytu.app/confidentialite')}>Confidentialité</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.lime, borderRadius: radius.xl, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  perk: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
});
