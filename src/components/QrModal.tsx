import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppText, Button } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme/tokens';

/**
 * Contenu du QR lu par le scanner partenaire : l'id du groupe + un code
 * secret que seul l'organisateur peut lire (table group_secrets).
 */
export const qrPayload = (groupId: string, code: string) => `wyytu:group:${groupId}:${code}`;
export const parseQr = (data: string) => {
  const m = /^wyytu:group:([0-9a-f-]{36}):([0-9a-f]{8,64})$/i.exec(data.trim());
  return m ? { groupId: m[1], code: m[2] } : null;
};

export function QrModal({ groupId, title, visible, onClose }: { groupId: string; title: string; visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    supabase
      .from('group_secrets')
      .select('check_in_code')
      .eq('group_id', groupId)
      .maybeSingle()
      .then(({ data }) => setCode(data?.check_in_code ?? null));
  }, [visible, groupId]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.back')}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <AppText variant="tag" color={colors.coralDark}>{t('outings.qrTitle').toUpperCase()}</AppText>
          <AppText variant="heading" center>{title}</AppText>
          <View style={styles.qr}>
            {code ? (
              <QRCode value={qrPayload(groupId, code)} size={220} color={colors.ink} backgroundColor={colors.white} />
            ) : (
              <View style={{ width: 220, height: 220, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={colors.coral} />
              </View>
            )}
          </View>
          <AppText variant="small" color={colors.sub} center>{t('outings.qrBody')}</AppText>
          <Button label={t('common.back')} kind="dark" onPress={onClose} style={{ alignSelf: 'stretch' }} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(17,16,20,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.xl, padding: 24, gap: 12, alignItems: 'center' },
  qr: { padding: 16, backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.lime },
});
