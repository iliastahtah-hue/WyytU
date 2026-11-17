import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/src/components/ui';
import { colors, radius } from '@/src/theme/tokens';
import { mediaUrl } from './media';

function useMediaUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    mediaUrl(path).then((u) => alive && setUrl(u)).catch(() => undefined);
    return () => { alive = false; };
  }, [path]);
  return url;
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;

export function ImageBubble({ path, onOpen }: { path: string; onOpen: (url: string) => void }) {
  const url = useMediaUrl(path);
  return (
    <Pressable onPress={() => url && onOpen(url)} style={styles.media}>
      {url ? <Image source={{ uri: url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} /> : <ActivityIndicator color={colors.coral} />}
    </Pressable>
  );
}

function VideoInner({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => { p.loop = false; });
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls fullscreenOptions={{ enable: true }} />;
}

export function VideoBubble({ path }: { path: string }) {
  const url = useMediaUrl(path);
  return <View style={styles.media}>{url ? <VideoInner url={url} /> : <ActivityIndicator color={colors.coral} />}</View>;
}

function AudioInner({ url, mine, durationMs }: { url: string; mine: boolean; durationMs: number | null }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);
  const total = status.duration || (durationMs ?? 0) / 1000;
  const progress = total ? Math.min(1, status.currentTime / total) : 0;
  // barres pseudo-aléatoires mais stables pour ce fichier
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 6 + ((url.length * 7 + i * 13) % 17)), [url]);
  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || (total && status.currentTime >= total - 0.05)) player.seekTo(0);
      player.play();
    }
  };
  const fg = mine ? colors.white : colors.ink;
  return (
    <View style={styles.audio}>
      <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Pause' : 'Lecture'} onPress={toggle}
        style={[styles.play, { backgroundColor: mine ? colors.coral : colors.ink }]}>
        <AppText variant="bodyStrong" color={colors.white}>{status.playing ? '❚❚' : '▶'}</AppText>
      </Pressable>
      <View style={styles.wave}>
        {bars.map((h, i) => (
          <View key={i} style={{ width: 3, height: h, borderRadius: 2, backgroundColor: fg, opacity: i / bars.length <= progress ? 1 : 0.3 }} />
        ))}
      </View>
      <AppText variant="small" color={fg} style={{ fontVariant: ['tabular-nums'], minWidth: 34 }}>
        {fmt(status.playing || status.currentTime > 0 ? status.currentTime : total)}
      </AppText>
    </View>
  );
}

export function AudioBubble({ path, mine, durationMs }: { path: string; mine: boolean; durationMs: number | null }) {
  const url = useMediaUrl(path);
  return url ? <AudioInner url={url} mine={mine} durationMs={durationMs} /> : <ActivityIndicator color={mine ? colors.white : colors.coral} />;
}

const styles = StyleSheet.create({
  media: { width: 220, height: 260, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' },
  audio: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, paddingVertical: 2 },
  play: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  wave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 30 },
});
