import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

const C = {
  gold: '#C9A84C',
  goldLight: '#E8C96A',
  goldPale: '#FDF8EE',
  beige: '#FAF7F2',
  beigeDeep: '#EEE8DE',
  brown: '#1A1209',
  brownMid: '#5C4A2A',
  white: '#FFFFFF',
  grayLight: '#F0EDE8',
  grayMid: '#C8C0B4',
  grayText: '#8A7F72',
  green: '#2ECC71',
  red: '#E8000D',
};

type Conversation = {
  id: string;
  titre: string;
  categorie: string;
  dernierMessage?: string;
  dernierMessageDate?: string;
  participants_count: number;
  nonLu?: boolean;
  nbNonLu?: number;
};

const CATEGORIES: Record<string, { couleur: string; emoji: string }> = {
  Sport: { couleur: '#E8000D', emoji: '⚡' },
  Resto: { couleur: '#FF6A00', emoji: '🍕' },
  Ciné: { couleur: '#7B2FBE', emoji: '🎬' },
  Soirée: { couleur: '#1A1A3A', emoji: '🎉' },
  Gaming: { couleur: '#0070F3', emoji: '🎮' },
  Voyage: { couleur: '#00B4D8', emoji: '✈️' },
  Musique: { couleur: '#1DB954', emoji: '🎵' },
  'Bien-être': { couleur: '#00897B', emoji: '🏃' },
  Social: { couleur: '#FF4B7D', emoji: '👥' },
  Art: { couleur: '#FFD600', emoji: '🎨' },
};

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');
  const [filtreActif, setFiltreActif] = useState('Tous');
  const [prenom, setPrenom] = useState('');

  useEffect(() => { chargerConversations(); }, []);

  const chargerConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profil } = await supabase
        .from('utilisateurs').select('prenom').eq('id', user.id).single();
      if (profil) setPrenom(profil.prenom || '');

      const { data: crees } = await supabase
        .from('activites').select('id, titre, categorie, participants_count')
        .eq('createur_id', user.id).order('created_at', { ascending: false });

      const { data: participations } = await supabase
        .from('participations').select('activite_id').eq('user_id', user.id);

      let rejointes: Conversation[] = [];
      if (participations && participations.length > 0) {
        const ids = participations.map((p: any) => p.activite_id);
        const { data } = await supabase
          .from('activites').select('id, titre, categorie, participants_count')
          .in('id', ids).order('created_at', { ascending: false });
        if (data) rejointes = data;
      }

      const tousIds = new Set();
      const toutes: Conversation[] = [];
      for (const a of [...(crees || []), ...rejointes]) {
        if (!tousIds.has(a.id)) { tousIds.add(a.id); toutes.push(a); }
      }

      const avecMessages = await Promise.all(
        toutes.map(async (conv) => {
          const { data: msgs } = await supabase
            .from('messages').select('contenu, created_at, prenom')
            .eq('activite_id', conv.id).order('created_at', { ascending: false }).limit(1);
          const nbNonLu = Math.random() > 0.6 ? Math.floor(Math.random() * 9) + 1 : 0;
          return {
            ...conv,
            dernierMessage: msgs?.[0] ? `${msgs[0].prenom}: ${msgs[0].contenu}` : 'Commencer la conversation...',
            dernierMessageDate: msgs?.[0]?.created_at || null,
            nonLu: nbNonLu > 0,
            nbNonLu,
          };
        })
      );

      avecMessages.sort((a, b) => {
        if (!a.dernierMessageDate) return 1;
        if (!b.dernierMessageDate) return -1;
        return new Date(b.dernierMessageDate).getTime() - new Date(a.dernierMessageDate).getTime();
      });

      setConversations(avecMessages);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const diff = today.getTime() - date.getTime();
    const hours = diff / 3600000;
    if (hours < 1) return `${Math.floor(diff / 60000)}min`;
    if (date.toDateString() === today.toDateString())
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const convsFiltrees = conversations.filter((c) => {
    const matchSearch = c.titre.toLowerCase().includes(recherche.toLowerCase());
    const matchFiltre =
      filtreActif === 'Tous' ||
      (filtreActif === 'Non lus' && c.nonLu) ||
      filtreActif === 'Groupes';
    return matchSearch && matchFiltre;
  });

  const totalNonLus = conversations.filter(c => c.nonLu).length;

  return (
    <View style={s.root}>

      {/* HEADER */}
      <LinearGradient
        colors={[C.brown, '#2C1F0A']}
        style={s.header}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerSub}>Bonjour{prenom ? `, ${prenom}` : ''} 👋</Text>
            <Text style={s.headerTitle}>Messages</Text>
          </View>
          <View style={s.headerRight}>
            {totalNonLus > 0 && (
              <View style={s.globalBadge}>
                <Text style={s.globalBadgeTxt}>{totalNonLus}</Text>
              </View>
            )}
            <TouchableOpacity style={s.composeBtn} activeOpacity={0.8}>
              <LinearGradient colors={[C.goldLight, C.gold]} style={s.composeBtnGrad}>
                <Text style={s.composeBtnIcon}>✏️</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* STATS ROW */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{conversations.length}</Text>
            <Text style={s.statLabel}>Groupes</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{totalNonLus}</Text>
            <Text style={s.statLabel}>Non lus</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={[s.statNum, { color: C.green }]}>●</Text>
            <Text style={s.statLabel}>En ligne</Text>
          </View>
        </View>
      </LinearGradient>

      {/* SEARCH */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={C.grayMid}
            value={recherche}
            onChangeText={setRecherche}
          />
          {recherche.length > 0 && (
            <TouchableOpacity onPress={() => setRecherche('')}>
              <Text style={s.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* FILTRES */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={s.filtresScroll}
        contentContainerStyle={s.filtresContent}>
        {['Tous', 'Non lus', 'Groupes'].map((f) => (
          <TouchableOpacity key={f} onPress={() => setFiltreActif(f)} activeOpacity={0.8}>
            {filtreActif === f ? (
              <LinearGradient colors={[C.goldLight, C.gold]} style={s.filtreActif}>
                <Text style={s.filtreActifTxt}>{f}</Text>
                {f === 'Non lus' && totalNonLus > 0 && (
                  <View style={s.filtreBadge}>
                    <Text style={s.filtreBadgeTxt}>{totalNonLus}</Text>
                  </View>
                )}
              </LinearGradient>
            ) : (
              <View style={s.filtre}>
                <Text style={s.filtreTxt}>{f}</Text>
                {f === 'Non lus' && totalNonLus > 0 && (
                  <View style={[s.filtreBadge, { backgroundColor: C.red }]}>
                    <Text style={s.filtreBadgeTxt}>{totalNonLus}</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* CONTENU */}
      {loading ? (
        <View style={s.loadingBox}>
          <ActivityIndicator size="large" color={C.gold} />
          <Text style={s.loadingTxt}>Chargement...</Text>
        </View>
      ) : convsFiltrees.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>💬</Text>
          <Text style={s.emptyTitle}>{recherche ? 'Aucun résultat' : 'Aucune conversation'}</Text>
          <Text style={s.emptySub}>{recherche ? 'Essaie un autre terme' : 'Rejoins un plan pour chatter !'}</Text>
          {!recherche && (
            <TouchableOpacity onPress={() => router.push('/(tabs)/explore' as any)} activeOpacity={0.85}>
              <LinearGradient colors={[C.goldLight, C.gold]} style={s.emptyBtn}>
                <Text style={s.emptyBtnTxt}>Explorer les plans →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={s.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); chargerConversations(); }}
              tintColor={C.gold} />
          }>

          {convsFiltrees.map((conv, index) => {
            const cat = CATEGORIES[conv.categorie] || { couleur: C.brownMid, emoji: '💬' };
            const initiales = conv.titre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

            return (
              <TouchableOpacity
                key={conv.id}
                style={[s.convCard, conv.nonLu && s.convCardUnread]}
                onPress={() => router.push(`/chat/${conv.id}` as any)}
                activeOpacity={0.75}>

                {/* AVATAR */}
                <View style={s.avatarWrap}>
                  <LinearGradient
                    colors={[cat.couleur + 'DD', cat.couleur]}
                    style={s.avatar}>
                    <Text style={s.avatarEmoji}>{cat.emoji}</Text>
                  </LinearGradient>
                  <View style={s.onlineDot} />
                </View>

                {/* INFO */}
                <View style={s.convInfo}>
                  <View style={s.convTop}>
                    <Text style={[s.convTitle, conv.nonLu && s.convTitleUnread]} numberOfLines={1}>
                      {conv.titre}
                    </Text>
                    <Text style={[s.convDate, conv.nonLu && s.convDateUnread]}>
                      {formatDate(conv.dernierMessageDate)}
                    </Text>
                  </View>
                  <View style={s.convBottom}>
                    <Text style={[s.convMsg, conv.nonLu && s.convMsgUnread]} numberOfLines={1}>
                      {conv.dernierMessage}
                    </Text>
                    <View style={s.convRight}>
                      {conv.nonLu && conv.nbNonLu! > 0 ? (
                        <LinearGradient colors={[C.goldLight, C.gold]} style={s.unreadBadge}>
                          <Text style={s.unreadBadgeTxt}>{conv.nbNonLu}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[s.catBadge, { backgroundColor: cat.couleur + '18' }]}>
                          <Text style={[s.catBadgeTxt, { color: cat.couleur }]}>
                            {conv.participants_count || 0} 👥
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* CATEGORIE TAG */}
                  <View style={[s.catTag, { backgroundColor: cat.couleur + '15', borderColor: cat.couleur + '30' }]}>
                    <Text style={[s.catTagTxt, { color: cat.couleur }]}>{conv.categorie}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 110 }} />
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.beige },

  // HEADER
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 30,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  headerSub: { fontSize: 13, color: C.goldLight, fontWeight: '600', marginBottom: 2 },
  headerTitle: { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: -1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  globalBadge: { backgroundColor: C.red, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, minWidth: 26, alignItems: 'center' },
  globalBadgeTxt: { color: C.white, fontSize: 12, fontWeight: '800' },
  composeBtn: { borderRadius: 22, overflow: 'hidden', shadowColor: C.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 4 },
  composeBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  composeBtnIcon: { fontSize: 18 },

  // STATS ROW
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, gap: 0 },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontSize: 18, fontWeight: '900', color: C.white },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 4 },

  // SEARCH
  searchWrap: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, borderWidth: 1.5, borderColor: C.beigeDeep, shadowColor: C.brown, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: C.brown, fontWeight: '500' },
  searchClear: { fontSize: 16, color: C.grayMid },

  // FILTRES
  filtresScroll: { maxHeight: 50 },
  filtresContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 8, alignItems: 'center' },
  filtre: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.beigeDeep },
  filtreTxt: { fontSize: 13, fontWeight: '700', color: C.grayText },
  filtreActif: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filtreActifTxt: { fontSize: 13, fontWeight: '800', color: C.white },
  filtreBadge: { backgroundColor: C.white, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  filtreBadgeTxt: { fontSize: 10, fontWeight: '900', color: C.brown },

  // LOADING / EMPTY
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTxt: { color: C.grayText, fontSize: 14, fontWeight: '600' },
  emptyBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: C.brown },
  emptySub: { fontSize: 14, color: C.grayText, textAlign: 'center' },
  emptyBtn: { borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnTxt: { color: C.white, fontSize: 14, fontWeight: '700' },

  // LISTE
  liste: { flex: 1 },
  convCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: C.grayLight },
  convCardUnread: { backgroundColor: C.goldPale },

  // AVATAR
  avatarWrap: { position: 'relative' },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3 },
  avatarEmoji: { fontSize: 24 },
  onlineDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: C.green, borderWidth: 2.5, borderColor: C.beige },

  // INFO
  convInfo: { flex: 1, gap: 3 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convTitle: { fontSize: 15, fontWeight: '600', color: C.brownMid, flex: 1, marginRight: 8 },
  convTitleUnread: { fontWeight: '800', color: C.brown },
  convDate: { fontSize: 12, color: C.grayMid, fontWeight: '500' },
  convDateUnread: { color: C.gold, fontWeight: '700' },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convMsg: { fontSize: 13, color: C.grayText, flex: 1, marginRight: 8 },
  convMsgUnread: { color: C.brownMid, fontWeight: '600' },
  convRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catBadgeTxt: { fontSize: 11, fontWeight: '700' },
  unreadBadge: { borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, minWidth: 24, alignItems: 'center' },
  unreadBadgeTxt: { color: C.white, fontSize: 11, fontWeight: '900' },
  catTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, marginTop: 2 },
  catTagTxt: { fontSize: 10, fontWeight: '700' },
});