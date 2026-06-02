import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Message = {
  id: string;
  contenu: string;
  prenom: string;
  user_id: string;
  created_at: string;
};

type Activite = {
  id: string;
  titre: string;
  categorie: string;
  participants_count: number;
};

const CATEGORIES: Record<string, { couleur: string; emoji: string }> = {
  Sport: { couleur: '#E8000D', emoji: '⚡' },
  Resto: { couleur: '#FF6A00', emoji: '🍕' },
  Ciné: { couleur: '#CC0000', emoji: '🎬' },
  Soirée: { couleur: '#7B2FBE', emoji: '🎉' },
  Gaming: { couleur: '#0070F3', emoji: '🎮' },
  Voyage: { couleur: '#00B4D8', emoji: '✈️' },
  Musique: { couleur: '#1DB954', emoji: '🎵' },
  'Bien-être': { couleur: '#00897B', emoji: '🏃' },
  Social: { couleur: '#FF4B7D', emoji: '👥' },
  Art: { couleur: '#FFD600', emoji: '🎨' },
};

const REACTIONS = ['❤️', '😂', '👍', '🔥', '😮', '👏'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [activite, setActivite] = useState<Activite | null>(null);
  const [loading, setLoading] = useState(true);
  const [texte, setTexte] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [prenom, setPrenom] = useState('');
  const [msgSelectionne, setMsgSelectionne] = useState<string | null>(null);

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `activite_id=eq.${id}` },
        (payload) => { setMessages((prev) => [...prev, payload.new as Message]); scrollToBottom(); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profil } = await supabase.from('utilisateurs').select('prenom').eq('email', user.email).single();
      setPrenom(profil?.prenom || user.email?.split('@')[0] || 'Moi');
    }
    const { data: act } = await supabase.from('activites').select('*').eq('id', id).single();
    if (act) setActivite(act);
    const { data: msgs } = await supabase.from('messages').select('*').eq('activite_id', id).order('created_at', { ascending: true });
    if (msgs) setMessages(msgs);
    setLoading(false);
    setTimeout(scrollToBottom, 300);
  };

  const scrollToBottom = () => scrollRef.current?.scrollToEnd({ animated: true });

  const envoyer = async () => {
    if (!texte.trim() || envoi) return;
    setEnvoi(true);
    const msg = texte.trim();
    setTexte('');
    await supabase.from('messages').insert({
      activite_id: id, user_id: userId, prenom, contenu: msg,
    });
    setEnvoi(false);
    scrollToBottom();
  };

  const formatHeure = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatJour = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const messagesParJour: { jour: string; msgs: Message[] }[] = [];
  messages.forEach((msg) => {
    const jour = formatJour(msg.created_at);
    const existing = messagesParJour.find((g) => g.jour === jour);
    if (existing) existing.msgs.push(msg);
    else messagesParJour.push({ jour, msgs: [msg] });
  });

  const cat = CATEGORIES[activite?.categorie || ''] || { couleur: '#1A1A1A', emoji: '💬' };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E8000D" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* HEADER */}
      <View style={[styles.header, { borderBottomColor: cat.couleur + '30' }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: cat.couleur }]}>
          <Text style={styles.headerAvatarEmoji}>{cat.emoji}</Text>
          <View style={styles.headerOnline} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitre} numberOfLines={1}>{activite?.titre || 'Chat'}</Text>
          <Text style={styles.headerSub}>
            {cat.emoji} {activite?.categorie} · {activite?.participants_count || 0} membres
          </Text>
        </View>

        {/* BOUTONS APPEL */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => router.push(`/appel/${id}?type=audio` as any)}>
            <Text style={styles.headerMenuIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerMenuBtn}
            onPress={() => router.push(`/appel/${id}?type=video` as any)}>
            <Text style={styles.headerMenuIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MESSAGES */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}>

        {messages.length === 0 && (
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>{cat.emoji}</Text>
            <Text style={styles.emptyChatTitre}>Commencez à chatter !</Text>
            <Text style={styles.emptyChatSub}>Soyez le premier à envoyer un message</Text>
          </View>
        )}

        {messagesParJour.map(({ jour, msgs }) => (
          <View key={jour}>
            <View style={styles.jourSeparateur}>
              <View style={styles.jourLine} />
              <Text style={styles.jourTexte}>{jour}</Text>
              <View style={styles.jourLine} />
            </View>

            {msgs.map((msg, i) => {
              const isMe = msg.user_id === userId;
              const isSameSender = i > 0 && msgs[i - 1].user_id === msg.user_id;

              return (
                <TouchableOpacity
                  key={msg.id}
                  activeOpacity={0.85}
                  onLongPress={() => setMsgSelectionne(msgSelectionne === msg.id ? null : msg.id)}
                  style={[styles.msgWrapper, isMe && styles.msgWrapperMe, !isSameSender && styles.msgWrapperFirst]}>

                  {!isMe && !isSameSender && (
                    <View style={[styles.msgAvatar, { backgroundColor: cat.couleur }]}>
                      <Text style={styles.msgAvatarTexte}>{msg.prenom?.[0]?.toUpperCase()}</Text>
                    </View>
                  )}
                  {!isMe && isSameSender && <View style={styles.msgAvatarSpacer} />}

                  <View style={styles.msgBubbleWrapper}>
                    {!isMe && !isSameSender && (
                      <Text style={[styles.msgPrenom, { color: cat.couleur }]}>{msg.prenom}</Text>
                    )}

                    <View style={[
                      styles.msgBulle,
                      isMe ? [styles.msgBulleMe, { backgroundColor: cat.couleur }] : styles.msgBulleAutre,
                      isSameSender && isMe && styles.msgBulleMeSame,
                      isSameSender && !isMe && styles.msgBulleAutreSame,
                    ]}>
                      <Text style={[styles.msgTexte, isMe && styles.msgTexteMe]}>{msg.contenu}</Text>
                    </View>

                    <View style={[styles.msgMeta, isMe && styles.msgMetaMe]}>
                      <Text style={styles.msgHeure}>{formatHeure(msg.created_at)}</Text>
                      {isMe && <Text style={styles.msgLu}>✓✓</Text>}
                    </View>

                    {msgSelectionne === msg.id && (
                      <View style={[styles.reactionsPanel, isMe && styles.reactionsPanelMe]}>
                        {REACTIONS.map((r) => (
                          <TouchableOpacity key={r} style={styles.reactionBtn} onPress={() => setMsgSelectionne(null)}>
                            <Text style={styles.reactionEmoji}>{r}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* INPUT */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.inputExtra}>
          <Text style={styles.inputExtraIcon}>+</Text>
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#BBB"
            value={texte}
            onChangeText={setTexte}
            multiline
            maxLength={500}
            onSubmitEditing={envoyer}
          />
          <TouchableOpacity style={styles.emojiBtn}>
            <Text style={styles.emojiBtnIcon}>😊</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: texte.trim() ? cat.couleur : '#EEE8DE' }]}
          onPress={envoyer}
          disabled={!texte.trim() || envoi}>
          <Text style={[styles.sendIcon, !texte.trim() && styles.sendIconDisabled]}>
            {envoi ? '⏳' : '↑'}
          </Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingBottom: 14, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerAvatarEmoji: { fontSize: 20 },
  headerOnline: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#1DB954', borderWidth: 2, borderColor: '#fff' },
  headerInfo: { flex: 1 },
  headerTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A' },
  headerSub: { fontSize: 11, color: '#AAA', marginTop: 1 },
  headerMenuBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  headerMenuIcon: { fontSize: 18 },
  messagesList: { flex: 1 },
  messagesContent: { paddingVertical: 16, paddingHorizontal: 12 },
  emptyChat: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyChatEmoji: { fontSize: 60 },
  emptyChatTitre: { fontSize: 18, fontWeight: '800', color: '#1A1A1A' },
  emptyChatSub: { fontSize: 14, color: '#AAA' },
  jourSeparateur: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 16 },
  jourLine: { flex: 1, height: 1, backgroundColor: '#EEE8DE' },
  jourTexte: { fontSize: 11, color: '#AAA', fontWeight: '600', paddingHorizontal: 8 },
  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 3 },
  msgWrapperMe: { flexDirection: 'row-reverse' },
  msgWrapperFirst: { marginTop: 10 },
  msgAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  msgAvatarTexte: { color: '#fff', fontSize: 13, fontWeight: '800' },
  msgAvatarSpacer: { width: 32 },
  msgBubbleWrapper: { maxWidth: '75%' },
  msgPrenom: { fontSize: 11, fontWeight: '700', marginBottom: 3, marginLeft: 4 },
  msgBulle: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10 },
  msgBulleMe: { borderBottomRightRadius: 6 },
  msgBulleAutre: { backgroundColor: '#fff', borderBottomLeftRadius: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 },
  msgBulleMeSame: { borderBottomRightRadius: 20, borderTopRightRadius: 6 },
  msgBulleAutreSame: { borderBottomLeftRadius: 20, borderTopLeftRadius: 6 },
  msgTexte: { fontSize: 15, color: '#1A1A1A', lineHeight: 21 },
  msgTexteMe: { color: '#fff' },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3, marginLeft: 4 },
  msgMetaMe: { flexDirection: 'row-reverse', marginRight: 4 },
  msgHeure: { fontSize: 10, color: '#BBB', fontWeight: '500' },
  msgLu: { fontSize: 10, color: '#1DB954', fontWeight: '700' },
  reactionsPanel: { flexDirection: 'row', gap: 4, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6, marginTop: 6 },
  reactionsPanelMe: { alignSelf: 'flex-end' },
  reactionBtn: { padding: 4 },
  reactionEmoji: { fontSize: 22 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F0EDE8' },
  inputExtra: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  inputExtraIcon: { fontSize: 22, color: '#AAA', fontWeight: '300' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F5F3EF', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: '#EEE8DE' },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', maxHeight: 100, lineHeight: 20 },
  emojiBtn: { paddingLeft: 8, paddingBottom: 2 },
  emojiBtnIcon: { fontSize: 20 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: '800' },
  sendIconDisabled: { color: '#AAA' },
});