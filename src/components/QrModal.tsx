import { Modal, Pressable, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { AppText, Button } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius } from '@/src/theme/tokens';

/** Le contenu du QR, lu par le scanner de l'espace partenaire */
export const qrPayload = (groupId: string) => `wyytu:group:${groupId}`;

export function QrModal({ groupId, title, visible, onClose }: { groupId: string; title: string; visible: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('common.back')}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <AppText variant="tag" color={colors.coralDark}>{t('outings.qrTitle').toUpperCase()}</AppText>
          <AppText variant="heading" center>{title}</AppText>
          <View style={styles.qr}>
            <QRCode value={qrPayload(groupId)} size={220} color={colors.ink} backgroundColor={colors.white} />
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
