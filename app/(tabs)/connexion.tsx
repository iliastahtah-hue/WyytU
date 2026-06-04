import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AGORA_APP_ID = 'e5454f77f09e4266b02bb96e4f2b5996';

export default function AppelScreen() {
  const { id, type } = useLocalSearchParams<{ id: string; type: string }>();
  const router = useRouter();
  const isVideo = type === 'video';

  const [joined, setJoined] = useState(false);
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [duree, setDuree] = useState(0);
  const [engine, setEngine] = useState<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Sur web on simule juste l'UI
    if (Platform.OS === 'web') {
      setTimeout(() => setJoined(true), 1500);
      return;
    }
    initAgora();
    return () => { cleanup(); };
  }, []);

  useEffect(() => {
    if (joined) {
      timerRef.current = setInterval(() => setDuree((d) => d + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [joined]);

  const initAgora = async () => {
    try {
      const { createAgoraRtcEngine, ChannelProfileType, ClientRoleType } = await import('react-native-agora');
      const rtcEngine = createAgoraRtcEngine();
      rtcEngine.initialize({ appId: AGORA_APP_ID });
      rtcEngine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);
      rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      if (isVideo) {
        rtcEngine.enableVideo();
        rtcEngine.startPreview();
      } else {
        rtcEngine.enableAudio();
      }
      rtcEngine.addListener('onJoinChannelSuccess', () => setJoined(true));
      await rtcEngine.joinChannel('', `wyytu-${id}`, 0, {});
      setEngine(rtcEngine);
    } catch (err) {
      console.log('Agora error:', err);
      setTimeout(() => setJoined(true), 1000);
    }
  };

  const cleanup = async () => {
    clearInterval(timerRef.current);
    if (engine) {
      await engine.leaveChannel();
      engine.release();
    }
  };

  const raccrocher = async () => {
    if (Platform.OS !== 'web') await cleanup();
    router.back();
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (Platform.OS !== 'web') engine?.muteLocalAudioStream(!muted);
  };

  const toggleVideo = () => {
    setVideoOff(!videoOff);
    if (Platform.OS !== 'web') engine?.muteLocalVideoStream(!videoOff);
  };

  const formatDuree = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.bgGradient} />
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.minimiseBtn} onPress={() => router.back()}>
          <Text style={styles.minimiseIcon}>↓</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitre}>{isVideo ? 'Appel vidéo 📹' : 'Appel audio 📞'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* CENTRAL */}
      <View style={styles.central}>
        <View style={styles.avatarOuter}>
          <View style={styles.avatarInner}>
            <Text style={styles.avatarEmoji}>{isVideo ? '📹' : '📞'}</Text>
          </View>
          {joined && <View style={styles.avatarPulse} />}
        </View>

        <Text style={styles.groupNom}>Groupe WyytU</Text>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: joined ? '#1DB954' : '#FF9500' }]} />
          <Text style={styles.statusTexte}>
            {joined ? formatDuree(duree) : 'Connexion...'}
          </Text>
        </View>

        <View style={styles.participantsRow}>
          {['Y', 'M', 'A', 'K'].map((l, i) => (
            <View key={i} style={[styles.participantAvatar, {
              backgroundColor: ['#E8000D', '#7B2FBE', '#0070F3', '#1DB954'][i],
              marginLeft: i > 0 ? -12 : 0,
            }]}>
              <Text style={styles.participantLettre}>{l}</Text>
            </View>
          ))}
          <View style={styles.participantCount}>
            <Text style={styles.participantCountTexte}>+3</Text>
          </View>
        </View>
        <Text style={styles.participantsLabel}>7 participants</Text>
      </View>

      {/* CONTRÔLES */}
      <View style={styles.controls}>
        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.ctrlBtnSmall}>
            <Text style={styles.ctrlBtnSmallIcon}>🔊</Text>
            <Text style={styles.ctrlBtnSmallLabel}>Haut-parleur</Text>
          </TouchableOpacity>
          {isVideo && (
            <TouchableOpacity style={[styles.ctrlBtnSmall, videoOff && styles.ctrlBtnSmallOff]} onPress={toggleVideo}>
              <Text style={styles.ctrlBtnSmallIcon}>{videoOff ? '📵' : '📹'}</Text>
              <Text style={styles.ctrlBtnSmallLabel}>{videoOff ? 'Caméra off' : 'Caméra'}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ctrlBtnSmall}>
            <Text style={styles.ctrlBtnSmallIcon}>👥</Text>
            <Text style={styles.ctrlBtnSmallLabel}>Participants</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtnSmall}>
            <Text style={styles.ctrlBtnSmallIcon}>💬</Text>
            <Text style={styles.ctrlBtnSmallLabel}>Chat</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.controlsMainRow}>
          <TouchableOpacity style={[styles.ctrlBtn, muted && styles.ctrlBtnOff]} onPress={toggleMute}>
            <Text style={styles.ctrlBtnIcon}>{muted ? '🔇' : '🎤'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.raccrocherBtn} onPress={raccrocher}>
            <Text style={styles.raccrocherIcon}>📵</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn}>
            <Text style={styles.ctrlBtnIcon}>{isVideo ? '🔄' : '🔊'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  bgGradient: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#1A1A2E' },
  bgCircle1: { position: 'absolute', width: 400, height: 400, borderRadius: 200, backgroundColor: '#E8000D', opacity: 0.08, top: -100, right: -100 },
  bgCircle2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#0070F3', opacity: 0.06, bottom: 100, left: -80 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20 },
  minimiseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  minimiseIcon: { fontSize: 20, color: '#fff' },
  headerTitre: { fontSize: 16, fontWeight: '700', color: '#fff' },
  central: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  avatarOuter: { position: 'relative', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  avatarInner: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  avatarEmoji: { fontSize: 60 },
  avatarPulse: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: '#1DB954', opacity: 0.15 },
  groupNom: { fontSize: 24, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTexte: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  participantsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  participantAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#1A1A2E' },
  participantLettre: { color: '#fff', fontSize: 16, fontWeight: '800' },
  participantCount: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginLeft: -12, borderWidth: 2, borderColor: '#1A1A2E' },
  participantCountTexte: { color: '#fff', fontSize: 12, fontWeight: '700' },
  participantsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  controls: { paddingHorizontal: 24, paddingBottom: 50, gap: 24 },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  ctrlBtnSmall: { alignItems: 'center', gap: 6 },
  ctrlBtnSmallOff: { opacity: 0.4 },
  ctrlBtnSmallIcon: { fontSize: 26 },
  ctrlBtnSmallLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  controlsMainRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 24 },
  ctrlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  ctrlBtnOff: { backgroundColor: 'rgba(255,255,255,0.05)', opacity: 0.5 },
  ctrlBtnIcon: { fontSize: 28 },
  raccrocherBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center', shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 8 },
  raccrocherIcon: { fontSize: 32 },
});