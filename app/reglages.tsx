import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { LANGS, useI18n } from '@/src/i18n';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, radius } from '@/src/theme/tokens';

const CONTACT = 'mailto:[E-MAIL DE CONTACT]';

function Row({ label, onPress, danger }: { label: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.row}>
      <AppText variant="bodyStrong" color={danger ? colors.danger : colors.ink} style={{ flex: 1 }}>{label}</AppText>
      <AppText variant="heading" color={colors.sub}>›</AppText>
    </Pressable>
  );
}

export default function ReglagesScreen() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();
  const { profile, signOut } = useAuth();

  const leave = async () => {
    await signOut();
    if (router.canDismiss()) router.dismissAll();
    router.replace('/');
  };

  const deleteAccount = () =>
    Alert.alert(
      'Supprimer mon compte',
      'Ton profil, tes photos, tes groupes et tes messages seront supprimés définitivement. Cette action est irréversible.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!profile) return;
            for (const bucket of ['photos', 'selfies'] as const) {
              const { data: files } = await supabase.storage.from(bucket).list(profile.id);
              if (files?.length) await supabase.storage.from(bucket).remove(files.map((f) => `${profile.id}/${f.name}`));
            }
            const { error } = await supabase.rpc('delete_my_account');
            if (error) return Alert.alert(readableError(error, t('common.error')));
            await leave();
          },
        },
      ],
    );

  return (
    <Screen scroll>
      <TopBar title="Réglages" />

      <AppText variant="label" color={colors.sub} style={styles.section}>LANGUE</AppText>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {LANGS.map((l) => (
          <Button key={l.id} small kind={lang === l.id ? 'dark' : 'outline'} label={l.native} onPress={() => setLang(l.id)} />
        ))}
      </View>

      <AppText variant="label" color={colors.sub} style={styles.section}>SÉCURITÉ</AppText>
      <View style={styles.group}>
        <Row label="Personnes bloquées" onPress={() => router.push('/bloques')} />
        <Row label="Signaler un problème" onPress={() => router.push('/signaler')} />
      </View>

      <AppText variant="label" color={colors.sub} style={styles.section}>AIDE ET INFOS</AppText>
      <View style={styles.group}>
        <Row label="Nous contacter" onPress={() => Linking.openURL(CONTACT)} />
        <Row label="Conditions et confidentialité" onPress={() => router.push('/legal')} />
      </View>

      <AppText variant="label" color={colors.sub} style={styles.section}>COMPTE</AppText>
      <View style={styles.group}>
        <Row label="Se déconnecter" onPress={leave} />
        <Row label="Supprimer mon compte" onPress={deleteAccount} danger />
      </View>
      <AppText variant="small" color={colors.muted} center style={{ marginTop: 24 }}>WyytU · version 1.0.0</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22, marginBottom: 8 },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.bg },
});
