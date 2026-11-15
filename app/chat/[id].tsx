import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Avatar, TopBar } from '@/src/components/ui';
import { fetchMiniProfiles, type MiniProfile } from '@/src/features/groups/api';
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

  const send = async () => {
    const body = text.trim();
    if (!body || !id || !me) return;
    setSending(true);
    const { data, error } = await supabase.from('group_messages').insert({ group_id: id, sender_id: me, body }).select('*').single();
    setSending(false);
    if (error) return Alert.alert(readableError(error, t('common.error')));
    setText('');
    if (data) setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
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
        <TopBar title={title} />
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
                  style={[styles.bubble, mine ? styles.mine : styles.theirs]}
                >
                  {showName ? <AppText variant="tag" color={colors.coralDark}>{who?.first_name ?? ''}</AppText> : null}
                  <AppText color={mine ? colors.white : colors.ink}>{item.body}</AppText>
                  <AppText variant="small" color={mine ? 'rgba(255,255,255,0.7)' : colors.muted} style={{ fontSize: 11, alignSelf: 'flex-end' }}>
                    {fmtTime(item.created_at, localeOf(lang))}
                  </AppText>
                </Pressable>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('chat.placeholder')}
            placeholderTextColor={colors.muted}
            style={styles.input}
            multiline
            maxLength={1000}
            accessibilityLabel={t('chat.placeholder')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('chat.send')}
            disabled={!text.trim() || sending}
            onPress={send}
            style={[styles.send, (!text.trim() || sending) && { opacity: 0.4 }]}
          >
            <AppText variant="heading" color={colors.white}>↑</AppText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
    flex: 1, minHeight: TOUCH, maxHeight: 120, borderRadius: 22, backgroundColor: colors.card, paddingHorizontal: 16, paddingVertical: 11,
    fontFamily: fonts.body, fontSize: 15, color: colors.ink,
  },
  send: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
});
