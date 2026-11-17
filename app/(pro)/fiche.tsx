import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { Cover } from '@/src/components/Cover';
import { AppText, Button, Chip, TextField } from '@/src/components/ui';
import { ProShell, proStyles as s } from '@/src/features/partners/ProShell';
import { usePartner } from '@/src/features/partners/usePartner';
import { useI18n } from '@/src/i18n';
import type { Partner } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme/tokens';

function Form({ partner, onSaved }: { partner: Partner; onSaved: () => void }) {
  const { t } = useI18n();
  const [description, setDescription] = useState(partner.description ?? '');
  const [hours, setHours] = useState(partner.opening_hours ?? '');
  const [phone, setPhone] = useState(partner.phone ?? '');
  const [address, setAddress] = useState(partner.address ?? '');
  const [discount, setDiscount] = useState(partner.discount_pct);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDescription(partner.description ?? '');
    setHours(partner.opening_hours ?? '');
    setPhone(partner.phone ?? '');
    setAddress(partner.address ?? '');
    setDiscount(partner.discount_pct);
  }, [partner]);

  const save = async () => {
    setLoading(true);
    const { error } = await supabase.from('partners').update({
      description: description.trim() || null,
      opening_hours: hours.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      discount_pct: discount,
    }).eq('id', partner.id);
    setLoading(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    Alert.alert(t('pro.saved'));
    onSaved();
  };

  return (
    <>
      <View style={{ borderRadius: radius.lg, overflow: 'hidden' }}>
        <Cover universe={partner.universe} height={150} iconSize={110}>
          <View style={{ flex: 1 }} />
          <AppText variant="tag">{t('pro.badge').toUpperCase()} · −{discount} %</AppText>
          <AppText variant="title" style={{ maxWidth: '75%' }}>{partner.name}</AppText>
        </Cover>
      </View>
      <View style={s.card}>
        <TextField label={t('pro.description')} value={description} onChangeText={setDescription} placeholder={t('pro.descriptionPh')} multiline maxLength={500} />
        <TextField label={t('partner.address')} value={address} onChangeText={setAddress} placeholder={t('partner.addressPh')} maxLength={120} />
        <TextField label={t('pro.hours')} value={hours} onChangeText={setHours} placeholder={t('pro.hoursPh')} maxLength={200} />
        <TextField label={t('pro.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+212 6 …" maxLength={30} />
        <AppText variant="label" color={colors.sub}>{t('pro.discountBase')}</AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {[5, 10, 15, 20].map((d) => <Chip key={d} label={`−${d} %`} selected={discount === d} onPress={() => setDiscount(d)} />)}
        </View>
        <Button label={t('pro.save')} onPress={save} loading={loading} />
      </View>
    </>
  );
}

export default function FicheScreen() {
  const { t } = useI18n();
  const { partner, reload } = usePartner();
  return (
    <ProShell partner={partner} title={t('pro.sheet')} onApplied={reload}>
      {(p) => <Form partner={p} onSaved={reload} />}
    </ProShell>
  );
}
