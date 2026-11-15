import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { parseQr } from '@/src/components/QrModal';
import { AppText, Button, Screen, TopBar } from '@/src/components/ui';
import { readableError, supabase } from '@/src/lib/supabase';
import { colors, radius } from '@/src/theme/tokens';

type Result = { ok: true; title: string; members: number; discount: number } | { ok: false; message: string };

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<Result | null>(null);
  const busy = useRef(false);

  const onScan = async (data: string) => {
    if (busy.current || result) return;
    const qr = parseQr(data);
    if (!qr) return; // QR qui n'est pas un QR WyytU : on ignore
    busy.current = true;
    const { data: res, error } = await supabase.rpc('partner_check_in', { p_group: qr.groupId, p_code: qr.code });
    busy.current = false;
    if (error || !res) setResult({ ok: false, message: readableError(error, 'QR non valide.') });
    else setResult({ ok: true, title: res.title, members: res.members, discount: res.discount_pct });
  };

  return (
    <Screen>
      <TopBar title="Scanner un groupe" />
      {result ? (
        <View style={[styles.result, { backgroundColor: result.ok ? colors.successSoft : colors.coralSoft }]}>
          <AppText style={{ fontSize: 56 }} center>{result.ok ? '✅' : '❌'}</AppText>
          {result.ok ? (
            <>
              <AppText variant="title" center>{result.title}</AppText>
              <AppText variant="bodyStrong" center>{result.members} personnes · présence validée</AppText>
              <View style={styles.discount}>
                <AppText variant="title" center>−{result.discount} %</AppText>
                <AppText variant="small" center>à appliquer sur l’addition du groupe</AppText>
              </View>
            </>
          ) : (
            <AppText variant="bodyStrong" center>{result.message}</AppText>
          )}
          <Button kind="dark" label="Scanner un autre QR" onPress={() => setResult(null)} />
        </View>
      ) : !permission?.granted ? (
        <View style={{ gap: 16, marginTop: 24 }}>
          <AppText center color={colors.sub}>La caméra sert à lire le QR du chef de groupe.</AppText>
          <Button label="Autoriser la caméra" onPress={requestPermission} />
        </View>
      ) : (
        <View style={styles.frame}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={({ data }) => onScan(data)}
          />
          <View style={styles.target} pointerEvents="none" />
          <AppText variant="label" color={colors.white} center style={styles.hint}>Vise le QR affiché par le chef de groupe</AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.ink, marginBottom: 12 },
  target: { position: 'absolute', left: '15%', right: '15%', top: '25%', aspectRatio: 1, borderWidth: 4, borderColor: colors.lime, borderRadius: radius.xl },
  hint: { position: 'absolute', bottom: 24, left: 0, right: 0 },
  result: { borderRadius: radius.xl, padding: 24, gap: 14, marginTop: 12 },
  discount: { backgroundColor: colors.lime, borderRadius: radius.lg, padding: 14 },
});
