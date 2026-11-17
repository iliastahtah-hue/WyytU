import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { buy, configurePurchases, getMonthlyPackage, purchasesAvailable, restore } from '@/src/lib/purchases';
import { readableError } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { img3d } from '@/src/theme/images';
import { colors, radius } from '@/src/theme/tokens';

const PERKS = [
  ['🔖', 'save'],
  ['🎟️', 'unlimited'],
  ['🚀', 'boost'],
  ['🎯', 'filters'],
  ['⭐', 'badge'],
] as const;

export default function PremiumScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const { feature } = useLocalSearchParams<{ feature?: string }>();
  const { t } = useI18n();
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

  const price = pkg?.product.priceString ?? null;

  const notYet = () =>
    Alert.alert(t('premium.soonTitle'), t('premium.soonBody'));

  const onBuy = async () => {
    if (!pkg) return notYet();
    setBusy(true);
    try {
      if (await buy(pkg)) {
        // le serveur active Premium via le webhook RevenueCat (quelques secondes)
        setTimeout(refreshProfile, 4000);
        Alert.alert(t('premium.welcomeTitle'), t('premium.welcomeBody'));
      }
    } catch (e) {
      Alert.alert(readableError(e, t('premium.buyError')));
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    if (!available) return notYet();
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? t('premium.restoredTitle') : t('premium.noneTitle'), ok ? t('premium.restoredBody') : t('premium.noneBody'));
      if (ok) setTimeout(refreshProfile, 4000);
    } catch (e) {
      Alert.alert(readableError(e, t('premium.restoreError')));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      scroll
      footer={
        profile?.is_premium ? (
          <Button kind="lime" label={t('premium.youAre')} disabled />
        ) : (
          <>
            <Button label={t('premium.tryFree')} onPress={onBuy} loading={busy} />
            <Button kind="ghost" label={t('premium.restore')} onPress={onRestore} disabled={busy} />
          </>
        )
      }
    >
      <TopBar title="Premium" />
      {feature && !profile?.is_premium ? (
        <View style={styles.locked}>
          <AppText style={{ fontSize: 22 }}>🔒</AppText>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyStrong">{t('premium.lockedTitle')}</AppText>
            <AppText variant="small" color={colors.sub}>{t(`premium.locked_${feature}`)}</AppText>
          </View>
        </View>
      ) : null}
      <View style={styles.hero}>
        <Image source={img3d.crown} style={{ width: 88, height: 88 }} />
        <AppText variant="display" center>WyytU Premium</AppText>
        <AppText variant="bodyStrong" center>{price ? t('premium.priceLine', { price }) : t('premium.trialLine')}</AppText>
      </View>
      <View style={{ gap: 10 }}>
        {PERKS.map(([e, key]) => (
          <View key={key} style={styles.perk}>
            <AppText style={{ fontSize: 26 }}>{e}</AppText>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyStrong">{t(`premium.${key}Title`)}</AppText>
              <AppText variant="small" color={colors.sub}>{t(`premium.${key}Body`)}</AppText>
            </View>
          </View>
        ))}
      </View>
      <AppText variant="small" color={colors.sub} style={{ marginTop: 16 }}>
        {t('premium.legal', { price: price ?? t('premium.monthlyPrice') })}
      </AppText>
      <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
        <AppText variant="small" color={colors.coralDark} onPress={() => Linking.openURL('https://wyytu.app/cgu')}>{t('premium.terms')}</AppText>
        <AppText variant="small" color={colors.coralDark} onPress={() => Linking.openURL('https://wyytu.app/confidentialite')}>{t('premium.privacy')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.lime, borderRadius: radius.xl, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16 },
  locked: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.coralSoft, borderRadius: radius.lg, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: colors.coral },
  perk: { flexDirection: 'row', gap: 12, alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14 },
});
