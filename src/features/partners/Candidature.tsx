import * as Location from 'expo-location';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppText, Button, Chip, TextField } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import type { Universe } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, UNIVERSES, universeColors } from '@/src/theme/tokens';

/* ---------- Devenir partenaire ---------- */
export function Candidature({ onDone }: { onDone: () => void }) {
  const { t } = useI18n();
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [universe, setUniverse] = useState<Universe>('sport');
  const [discount, setDiscount] = useState(10);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!session) return;
    setLoading(true);
    let coords: { lat: number | null; lng: number | null } = { lat: null, lng: null };
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({});
        coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      }
    } catch {
      // la position est facultative : l'équipe peut la corriger
    }
    const { error } = await supabase.from('partners').insert({
      owner_id: session.user.id,
      name: name.trim(),
      address: address.trim() || null,
      universe,
      discount_pct: discount,
      ...coords,
    });
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    Alert.alert(t('partner.sentTitle'), t('partner.sentBody'));
    onDone();
  };

  return (
    <View style={{ gap: 16 }}>
      <AppText variant="title">{t('partner.become')}</AppText>
      <AppText color={colors.sub}>
        {t('partner.pitch')}
      </AppText>
      <TextField label={t('partner.name')} value={name} onChangeText={setName} placeholder={t('partner.namePh')} maxLength={80} />
      <TextField label={t('partner.address')} value={address} onChangeText={setAddress} placeholder={t('partner.addressPh')} maxLength={120} />
      <AppText variant="label" color={colors.sub}>{t('partner.activity')}</AppText>
      <View style={styles.wrap}>
        {UNIVERSES.map((u) => (
          <Chip key={u.id} label={`${u.emoji} ${t(`universes.${u.id}`)}`} selected={universe === u.id} color={universeColors[u.id].bg} soft={universeColors[u.id].soft} onPress={() => setUniverse(u.id)} />
        ))}
      </View>
      <AppText variant="label" color={colors.sub}>{t('partner.discount')}</AppText>
      <View style={styles.wrap}>
        {[5, 10, 15, 20].map((d) => <Chip key={d} label={`−${d} %`} selected={discount === d} onPress={() => setDiscount(d)} />)}
      </View>
      <AppText variant="small" color={colors.sub}>{t('partner.locationHint')}</AppText>
      <Button label={t('partner.apply')} onPress={submit} loading={loading} disabled={name.trim().length < 2} />
    </View>
  );
}


const styles = StyleSheet.create({ wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
