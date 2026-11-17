import { useLocalSearchParams, useRouter } from 'expo-router';
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Avatar, TopBar } from '@/src/components/ui';
import { fetchMiniProfiles, type MiniProfile } from '@/src/features/groups/api';
import { AudioBubble, ImageBubble, VideoBubble } from '@/src/features/chat/Bubbles';
import { EmojiPanel } from '@/src/features/chat/EmojiPanel';
import { uploadChatMedia } from '@/src/features/chat/media';
import { localeOf } from '@/src/features/groups/time';
import { useI18n } from '@/src/i18n';
import type { Message } from '@/src/lib/database.types';
import { readableError, supabase } from '@/src/lib/supabase';
import { fmtTime } from '@/src/lib/tz';
import { useAuth } from '@/src/providers/AuthProvider';
import { colors, fonts, radius, TOUCH } from '@/src/theme/tokens';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { session } = useAuth();
  const me = session?.user.id;
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [people, setPeople] = useState<Record<string, MiniProfile>>({});
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const [emoji, setEmoji] = useState(false);
  const [viewer, setViewer] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const rec = useAudioRecorderState(recorder, 200);
  const [recording, setRecording] = useState(false);

  const ensureProfiles = useCallback(async (ids: string[]) => {
    const missing = ids.filter((x) => !people[x]);
    if (!missing.length) return;
    const found = await fetchMiniProfiles(missing);
    setPeople((p) => ({ ...p, ...found }));
  }, [people]);

  useEffect(() => {
    if (!id) return;
    supabase.from('groups').select('title').eq('id', id).maybeSingle().then(({ data }) => setTitle(data?.title ?? ''));
    supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
      .limit(100)
      .then(async ({ data }) => {
        const list = (data ?? []).reverse();
        setMessages(list);
        const found = await fetchMiniProfiles([...new Set(list.map((m) => m.sender_id))]);
        setPeople((p) => ({ ...p, ...found }));
      });

    // Nouveaux messages en temps réel
    const channel = supabase
      .channel(`chat:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages', filter: `group_id=eq.${id}` }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    ensureProfiles([...new Set(messages.map((m) => m.sender_id))]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  const insert = async (row: Partial<Pick<Message, 'body' | 'kind' | 'media_path' | 'duration_ms'>>) => {
    if (!id || !me) return;
    const { data, error } = await supabase.from('group_messages').insert({ group_id: id, sender_id: me, ...row }).select('*').single();
    if (error) throw error;
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
  };

  const send = async () => {
    const body = text.trim();
    if (!body) return;
    setSending(true);
    try {
      await insert({ body });
      setText('');
    } catch (e) {
      Alert.alert(readableError(e, t('common.error')));
    } finally {
      setSending(false);
    }
  };

  const sendFile = async (uri: string, mime: string, kind: 'image' | 'video' | 'audio', durationMs?: number | null) => {
    if (!id) return;
    setSending(true);
    try {
      const path = await uploadChatMedia(id, uri, mime);
      await insert({ kind, media_path: path, duration_ms: durationMs ? Math.round(durationMs) : null, body: '' });
    } catch (e) {
      Alert.alert(readableError(e, t('common.error')));
    } finally {
      setSending(false);
    }
  };

  const pick = async (fromCamera: boolean) => {
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images', 'videos'], quality: 0.8, videoMaxDuration: 60 };
    if (fromCamera) {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
    }
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    const a = res.canceled ? null : res.assets[0];
    if (!a) return;
    const isVideo = a.type === 'video';
    await sendFile(a.uri, a.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'), isVideo ? 'video' : 'image', a.duration ?? null);
  };

  const attach = () => {
    Keyboard.dismiss();
    setEmoji(false);
    const choices = [t('chat.photoVideo'), t('chat.camera'), t('common.cancel')];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: choices, cancelButtonIndex: 2 }, (i) => { if (i < 2) pick(i === 1); });
    } else {
      Alert.alert('', '', [
        { text: choices[0], onPress: () => pick(false) },
        { text: choices[1], onPress: () => pick(true) },
        { text: choices[2], style: 'cancel' },
      ]);
    }
  };

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) return Alert.alert(t('chat.micDenied'));
    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
  };

  const stopRecording = async (keep: boolean) => {
    const duration = rec.durationMillis;
    await recorder.stop();
    setRecording(false);
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
    if (keep && recorder.uri && duration > 700) await sendFile(recorder.uri, 'audio/m4a', 'audio', duration);
  };

  const call = (video: boolean) => {
    Alert.alert(t('chat.callTitle'), t('chat.callBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chat.join'),
        onPress: () =>
          WebBrowser.openBrowserAsync(
            `https://meet.jit.si/WyytU-${id}#config.prejoinConfig.enabled=false&config.startWithVideoMuted=${video ? 'false' : 'true'}`,
          ),
      },
    ]);
  };

  const reportMessage = (m: Message) => {
    const go = () => router.push({ pathname: '/signaler', params: { userId: m.sender_id, groupId: m.group_id, messageId: m.id } });
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: [t('chat.report'), t('common.cancel')], destructiveButtonIndex: 0, cancelButtonIndex: 1 },
        (i) => i === 0 && go(),
      );
    } else {
      Alert.alert(t('chat.report'), '', [{ text: t('common.cancel'), style: 'cancel' }, { text: t('chat.report'), style: 'destructive', onPress: go }]);
    }
  };

  return (
    <SafeAreaView style={styles.fill} edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 8 }}>
        <TopBar
          title={title}
          right={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.callAudio')} onPress={() => call(false)} style={styles.headBtn}>
                <AppText style={{ fontSize: 18 }}>📞</AppText>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.callVideo')} onPress={() => call(true)} style={styles.headBtn}>
                <AppText style={{ fontSize: 18 }}>🎥</AppText>
              </Pressable>
            </View>
          }
        />
      </View>
      <KeyboardAvoidingView style={styles.fill} behavior="padding" keyboardVerticalOffset={0}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<AppText color={colors.sub} center style={{ marginTop: 40 }}>{t('chat.empty')}</AppText>}
          renderItem={({ item, index }) => {
            const mine = item.sender_id === me;
            const prev = messages[index - 1];
            const showName = !mine && prev?.sender_id !== item.sender_id;
            const who = people[item.sender_id];
            return (
              <View style={[styles.line, mine && { justifyContent: 'flex-end' }]}>
                {!mine ? (
                  <View style={{ width: 32 }}>
                    {showName ? <Avatar name={who?.first_name ?? '?'} uri={who?.photo} seed={item.sender_id} size={32} /> : null}
                  </View>
                ) : null}
                <Pressable
                  onLongPress={() => !mine && reportMessage(item)}
                  accessibilityHint={!mine ? t('chat.report') : undefined}
                  style={[styles.bubble, mine ? styles.mine : styles.theirs, item.kind === 'image' || item.kind === 'video' ? { padding: 4 } : null]}
                >
                  {showName ? <AppText variant="tag" color={colors.coralDark}>{who?.first_name ?? ''}</AppText> : null}
                  {item.kind === 'image' && item.media_path ? <ImageBubble path={item.media_path} onOpen={setViewer} /> : null}
                  {item.kind === 'video' && item.media_path ? <VideoBubble path={item.media_path} /> : null}
                  {item.kind === 'audio' && item.media_path ? <AudioBubble path={item.media_path} mine={mine} durationMs={item.duration_ms} /> : null}
                  {item.body ? <AppText color={mine ? colors.white : colors.ink} style={item.kind === 'text' && /^\p{Extended_Pictographic}{1,3}$/u.test(item.body) ? { fontSize: 40, lineHeight: 48 } : undefined}>{item.body}</AppText> : null}
                  <AppText variant="small" color={mine ? 'rgba(255,255,255,0.7)' : colors.muted} style={{ fontSize: 11, alignSelf: 'flex-end' }}>
                    {fmtTime(item.created_at, localeOf(lang))}
                  </AppText>
                </Pressable>
              </View>
            );
          }}
        />
        {recording ? (
          <View style={styles.composer}>
            <Pressable accessibilityRole="button" onPress={() => stopRecording(false)} style={styles.iconBtn}>
              <AppText variant="label" color={colors.danger}>{t('chat.cancel')}</AppText>
            </Pressable>
            <View style={styles.recBox}>
              <View style={styles.recDot} />
              <AppText variant="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
                {Math.floor(rec.durationMillis / 60000)}:{String(Math.floor((rec.durationMillis % 60000) / 1000)).padStart(2, '0')}
              </AppText>
              <AppText variant="small" color={colors.sub}>{t('chat.recording')}</AppText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={t('chat.send')} onPress={() => stopRecording(true)} style={styles.send}>
              <AppText variant="heading" color={colors.white}>↑</AppText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.composer}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('chat.photoVideo')} onPress={attach} style={styles.iconBtn}>
              <AppText style={{ fontSize: 24, color: colors.ink }}>＋</AppText>
            </Pressable>
            <View style={styles.inputWrap}>
              <TextInput
                value={text}
                onChangeText={setText}
                onFocus={() => setEmoji(false)}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={colors.muted}
                style={styles.input}
                multiline
                maxLength={1000}
                accessibilityLabel={t('chat.placeholder')}
              />
              <Pressable accessibilityRole="button" accessibilityLabel="Émojis" onPress={() => { Keyboard.dismiss(); setEmoji((e) => !e); }} style={styles.emojiBtn}>
                <AppText style={{ fontSize: 22 }}>{emoji ? '⌨️' : '😊'}</AppText>
              </Pressable>
            </View>
            {sending ? (
              <View style={styles.send}><ActivityIndicator color={colors.white} /></View>
            ) : text.trim() ? (
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.send')} onPress={send} style={styles.send}>
                <AppText variant="heading" color={colors.white}>↑</AppText>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" accessibilityLabel={t('chat.voice')} onPress={startRecording} style={[styles.send, { backgroundColor: colors.ink }]}>
                <AppText style={{ fontSize: 20 }}>🎤</AppText>
              </Pressable>
            )}
          </View>
        )}
        {emoji && !recording ? <EmojiPanel onPick={(e) => setText((x) => x + e)} /> : null}
      </KeyboardAvoidingView>
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={styles.viewer} onPress={() => setViewer(null)}>
          {viewer ? <Image source={{ uri: viewer }} style={{ width: '100%', height: '80%' }} contentFit="contain" /> : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.lg, gap: 2 },
  mine: { backgroundColor: colors.ink, borderBottomRightRadius: 6 },
  theirs: { backgroundColor: colors.card, borderBottomLeftRadius: 6 },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.bg },
  input: {
    flex: 1, minHeight: TOUCH, maxHeight: 120, paddingLeft: 16, paddingRight: 4, paddingVertical: 11,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  headBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { minWidth: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, paddingHorizontal: 6 },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: colors.card, borderRadius: 22 },
  emojiBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  recBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, height: TOUCH, backgroundColor: colors.card, borderRadius: 22, paddingHorizontal: 16 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  send: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
});
