import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
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

const COULEURS_AVATAR = ['#E8000D', '#7B2FBE', '#0070F3', '#1DB954', '#FF6A00', '#00B4D8', '#FF4B7D'];

const getAvatarCouleur = (prenom: string) => {
  let hash = 0;
  for (let i = 0; i < prenom.length; i++) hash = prenom.charCodeAt(i) + hash;
  return COULEURS_AVATAR[hash % COULEURS_AVATAR.length];
};

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
  const [isTyping, setIsTyping] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { init(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-${id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `activite_id=eq.${id}`
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as Message]);
        scrollToBottom();
      }).subscribe();
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
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    setTimeout(scrollToBottom, 300);
  };

  const scrollToBottom = () => scrollRef.current?.scrollToEnd({ animated: true });

  const envoyer = async () => {
    if (!texte.trim() || envoi) return;
    setEnvoi(true);
    const msg = texte.trim();
    setTexte('');
    await supabase.from('messages').insert({ activite_id: id, user_id: userId, prenom, contenu: msg });
    setEnvoi(false);
    scrollToBottom();
  };

  const formatHeure = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}>

      {/* HEADER PREMIUM */}
      <View style={styles.header}>
        <View style={[styles.headerBg, { backgroundColor: cat.couleur }]} />
        <View style={styles.headerBgCircle} />

        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerAvatarWrapper}>
          <View style={[styles.headerAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.headerAvatarEmoji}>{cat.emoji}</Text>
          </View>
          <View style={styles.headerOnline} />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitre} numberOfLines={1}>{activite?.titre || 'Chat'}</Text>
          <Text style={styles.headerSub}>
            {activite?.participants_count || 0} membres · en ligne
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push(`/appel/${id}?type=audio` as any)}>
            <Text style={styles.headerActionIcon}>📞</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={() => router.push(`/appel/${id}?type=video` as any)}>
            <Text style={styles.headerActionIcon}>📹</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* MESSAGES */}
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}>

          {messages.length === 0 && (
            <View style={styles.emptyChat}>
              <View style={[styles.emptyChatIconWrapper, { backgroundColor: cat.couleur + '20' }]}>
                <Text style={styles.emptyChatEmoji}>{cat.emoji}</Text>
              </View>
              <Text style={styles.emptyChatTitre}>Commencez à chatter !</Text>
              <Text style={styles.emptyChatSub}>Soyez le premier à envoyer un message dans ce groupe</Text>
              <View style={[styles.emptyChatBadge, { backgroundColor: cat.couleur + '15', borderColor: cat.couleur + '30' }]}>
                <Text style={[styles.emptyChatBadgeTexte, { color: cat.couleur }]}>
                  {activite?.participants_count || 0} membres dans ce groupe
                </Text>
              </View>
            </View>
          )}

          {messagesParJour.map(({ jour, msgs }) => (
            <View key={jour}>
              {/* SÉPARATEUR JOUR */}
              <View style={styles.jourSep}>
                <View style={styles.jourLine} />
                <View style={styles.jourBadge}>
                  <Text style={styles.jourTexte}>{jour}</Text>
                </View>
                <View style={styles.jourLine} />
              </View>

              {msgs.map((msg, i) => {
                const isMe = msg.user_id === userId;
                const isSameSender = i > 0 && msgs[i - 1].user_id === msg.user_id;
                const isLastInGroup = i === msgs.length - 1 || msgs[i + 1].user_id !== msg.user_id;
                const avatarCouleur = getAvatarCouleur(msg.prenom || '');

                return (
                  <TouchableOpacity
                    key={msg.id}
                    activeOpacity={0.9}
                    onLongPress={() => setMsgSelectionne(msgSelectionne === msg.id ? null : msg.id)}
                    style={[
                      styles.msgRow,
                      isMe ? styles.msgRowMe : styles.msgRowOther,
                      !isSameSender && styles.msgRowFirst,
                    ]}>

                    {/* AVATAR (autres) */}
                    {!isMe && (
                      <View style={styles.msgAvatarCol}>
                        {!isSameSender ? (
                          <View style={[styles.msgAvatar, { backgroundColor: avatarCouleur }]}>
                            <Text style={styles.msgAvatarTexte}>{msg.prenom?.[0]?.toUpperCase()}</Text>
                          </View>
                        ) : (
                          <View style={styles.msgAvatarSpacer} />
                        )}
                      </View>
                    )}

                    <View style={[styles.msgBubbleCol, isMe && styles.msgBubbleColMe]}>
                      {/* PRÉNOM */}
                      {!isMe && !isSameSender && (
                        <Text style={[styles.msgPrenom, { color: avatarCouleur }]}>{msg.prenom}</Text>
                      )}

                      {/* BULLE */}
                      <View style={[
                        styles.msgBulle,
                        isMe
                          ? [styles.msgBulleMe, { backgroundColor: cat.couleur }]
                          : styles.msgBulleAutre,
                        isSameSender && isMe && styles.msgBulleMeSame,
                        isSameSender && !isMe && styles.msgBulleAutreSame,
                        isLastInGroup && isMe && styles.msgBulleMeLast,
                        isLastInGroup && !isMe && styles.msgBulleAutreLast,
                      ]}>
                        <Text style={[styles.msgTexte, isMe && styles.msgTexteMe]}>
                          {msg.contenu}
                        </Text>
                      </View>

                      {/* META */}
                      {isLastInGroup && (
                        <View style={[styles.msgMeta, isMe && styles.msgMetaMe]}>
                          <Text style={styles.msgHeure}>{formatHeure(msg.created_at)}</Text>
                          {isMe && (
                            <Text style={[styles.msgStatus, { color: cat.couleur }]}>✓✓</Text>
                          )}
                        </View>
                      )}

                      {/* REACTIONS */}
                      {msgSelectionne === msg.id && (
                        <View style={[styles.reactionsBar, isMe && styles.reactionsBarMe]}>
                          {REACTIONS.map((r) => (
                            <TouchableOpacity
                              key={r}
                              style={styles.reactionBtn}
                              onPress={() => setMsgSelectionne(null)}>
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

          {/* TYPING INDICATOR */}
          {isTyping && (
            <View style={styles.typingRow}>
              <View style={styles.typingBulle}>
                <Text style={styles.typingDots}>• • •</Text>
              </View>
            </View>
          )}

          <View style={{ height: 8 }} />
        </ScrollView>
      </Animated.View>

      {/* INPUT BAR PREMIUM */}
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.inputExtraBtn}>
          <Text style={styles.inputExtraBtnIcon}>+</Text>
        </TouchableOpacity>

        <View style={[styles.inputWrapper, texte.length > 0 && styles.inputWrapperActive]}>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#BBB"
            value={texte}
            onChangeText={setTexte}
            multiline
            maxLength={500}
          />
          {texte.length === 0 && (
            <TouchableOpacity style={styles.emojiBtn}>
              <Text style={styles.emojiBtnIcon}>😊</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: texte.trim() ? cat.couleur : '#EEE8DE' },
            texte.trim() && { shadowColor: cat.couleur, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
          ]}
          onPress={envoyer}
          disabled={!texte.trim() || envoi}
          activeOpacity={0.8}>
          <Text style={[styles.sendIcon, !texte.trim() && styles.sendIconDisabled]}>
            {envoi ? '⏳' : '↑'}
          </Text>
        </TouchableOpacity>
      </View>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F3EF' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F3EF' },

  // HEADER
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 56, paddingBottom: 14, paddingHorizontal: 16, gap: 10, position: 'relative', overflow: 'hidden' },
  headerBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.95 },
  headerBgCircle: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.08)', right: -60, top: -80 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  backIcon: { fontSize: 20, color: '#fff', fontWeight: '700' },
  headerAvatarWrapper: { position: 'relative' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  headerAvatarEmoji: { fontSize: 22 },
  headerOnline: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#1DB954', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' },
  headerInfo: { flex: 1 },
  headerTitre: { fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 6 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerActionIcon: { fontSize: 17 },

  // MESSAGES
  messagesList: { flex: 1 },
  messagesContent: { paddingHorizontal: 14, paddingVertical: 16 },

  // EMPTY
  emptyChat: { alignItems: 'center', paddingTop: 60, gap: 12, paddingHorizontal: 40 },
  emptyChatIconWrapper: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyChatEmoji: { fontSize: 40 },
  emptyChatTitre: { fontSize: 18, fontWeight: '900', color: '#1A1A1A', textAlign: 'center' },
  emptyChatSub: { fontSize: 14, color: '#AAA', textAlign: 'center', lineHeight: 20 },
  emptyChatBadge: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, marginTop: 4 },
  emptyChatBadgeTexte: { fontSize: 13, fontWeight: '700' },

  // SÉPARATEUR JOUR
  jourSep: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 20 },
  jourLine: { flex: 1, height: 1, backgroundColor: '#E8E4DE' },
  jourBadge: { backgroundColor: '#E8E4DE', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  jourTexte: { fontSize: 11, color: '#999', fontWeight: '600' },

  // MSG ROW
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgRowOther: {},
  msgRowFirst: { marginTop: 12 },
  msgAvatarCol: { width: 34, marginRight: 6 },
  msgAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  msgAvatarTexte: { color: '#fff', fontSize: 12, fontWeight: '800' },
  msgAvatarSpacer: { width: 30 },
  msgBubbleCol: { maxWidth: '75%', gap: 2 },
  msgBubbleColMe: { alignItems: 'flex-end' },
  msgPrenom: { fontSize: 11, fontWeight: '700', marginBottom: 2, marginLeft: 2 },

  // BULLES
  msgBulle: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  msgBulleMe: { borderBottomRightRadius: 4 },
  msgBulleAutre: { backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  msgBulleMeSame: { borderRadius: 18, borderBottomRightRadius: 4, borderTopRightRadius: 4 },
  msgBulleAutreSame: { borderRadius: 18, borderBottomLeftRadius: 4, borderTopLeftRadius: 4 },
  msgBulleMeLast: { borderBottomRightRadius: 4 },
  msgBulleAutreLast: { borderBottomLeftRadius: 4 },
  msgTexte: { fontSize: 15, color: '#1A1A1A', lineHeight: 21 },
  msgTexteMe: { color: '#fff' },

  // META
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2, marginLeft: 2 },
  msgMetaMe: { flexDirection: 'row-reverse', marginRight: 2 },
  msgHeure: { fontSize: 10, color: '#BBB', fontWeight: '500' },
  msgStatus: { fontSize: 11, fontWeight: '700' },

  // REACTIONS
  reactionsBar: { flexDirection: 'row', gap: 3, backgroundColor: '#fff', borderRadius: 24, padding: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 8, marginTop: 6, alignSelf: 'flex-start' },
  reactionsBarMe: { alignSelf: 'flex-end' },
  reactionBtn: { padding: 3 },
  reactionEmoji: { fontSize: 22 },

  // TYPING
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 8 },
  typingBulle: { backgroundColor: '#fff', borderRadius: 18, borderBottomLeftRadius: 4, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  typingDots: { fontSize: 14, color: '#BBB', letterSpacing: 2 },

  // INPUT BAR
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 32 : 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EEE8DE' },
  inputExtraBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F0EDE8', alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  inputExtraBtnIcon: { fontSize: 22, color: '#999', fontWeight: '300' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#F5F3EF', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, borderWidth: 1.5, borderColor: '#EEE8DE', minHeight: 44 },
  inputWrapperActive: { borderColor: '#1A1A1A', backgroundColor: '#fff' },
  input: { flex: 1, fontSize: 15, color: '#1A1A1A', maxHeight: 100, lineHeight: 21 },
  emojiBtn: { paddingLeft: 8, paddingBottom: 1 },
  emojiBtnIcon: { fontSize: 20 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 1 },
  sendIcon: { fontSize: 18, color: '#fff', fontWeight: '900' },
  sendIconDisabled: { color: '#AAA' },
});