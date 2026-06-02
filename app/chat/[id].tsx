import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Conversation = {
  id: string;
  titre: string;
  categorie: string;
  dernierMessage?: string;
  dernierMessageDate?: string;
  participants_count: number;
  nonLu?: boolean;
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

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recherche, setRecherche] = useState('');

  useEffect(() => { chargerConversations(); }, []);

  const chargerConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: crees } = await supabase
        .from('activites')
        .select('id, titre, categorie, participants_count')
        .eq('createur_id', user.id)
        .order('created_at', { ascending: false });

      const { data: participations } = await supabase
        .from('participations')
        .select('activite_id')
        .eq('user_id', user.id);

      let rejointes: Conversation[] = [];
      if (participations && participations.length > 0) {
        const ids = participations.map((p) => p.activite_id);
        const { data } = await supabase
          .from('activites')
          .select('id, titre, categorie, participants_count')
          .in('id', ids)
          .order('created_at', { ascending: false });
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
            .from('messages')
            .select('contenu, created_at, prenom')
            .eq('activite_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);
          return {
            ...conv,
            dernierMessage: msgs?.[0] ? `${msgs[0].prenom}: ${msgs[0].contenu}` : 'Commencer la conversation...',
            dernierMessageDate: msgs?.[0]?.created_at || null,
            nonLu: Math.random() > 0.5, // demo
          };
        })
      );

      // Trier par date du dernier message
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
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const convsFiltrees = conversations.filter((c) =>
    c.titre.toLowerCase().includes(recherche.toLowerCase())
  );

  const nonLusCount = conversations.filter((c) => c.nonLu).length;

  return (
    <View style={styles.container}>

      {/* HEADER STYLE MESSENGER */}
      <View style={styles.header}>
        <View>
          <Text style={styles.titre}>Messages</Text>
          {nonLusCount > 0 && (
            <Text style={styles.sousTitre}>{nonLusCount} non lu{nonLusCount > 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn}>
            <Text style={styles.headerBtnIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RECHERCHE */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          placeholderTextColor="#BBB"
          value={recherche}
          onChangeText={setRecherche}
        />
        {recherche.length > 0 && (
          <TouchableOpacity onPress={() => setRecherche('')}>
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* FILTRES RAPIDES */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtresContent} style={styles.filtresScroll}>
        {['Tous', 'Non lus', 'Groupes'].map((f) => (
          <TouchableOpacity key={f} style={[styles.filtreChip, f === 'Tous' && styles.filtreChipActive]}>
            <Text style={[styles.filtreChipTexte, f === 'Tous' && styles.filtreChipTexteActive]}>{f}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
        </View>
      ) : convsFiltrees.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTexte}>
            {recherche ? 'Aucun résultat' : 'Aucune conversation'}
          </Text>
          <Text style={styles.emptySub}>
            {recherche ? 'Essaie un autre terme' : 'Rejoins un plan pour chatter !'}
          </Text>
          {!recherche && (
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/explore' as any)}>
              <Text style={styles.emptyBtnTexte}>Explorer les plans →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView
          style={styles.liste}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); chargerConversations(); }} tintColor="#E8000D" />}>

          {convsFiltrees.map((conv) => {
            const cat = CATEGORIES[conv.categorie] || { couleur: '#1A1A1A', emoji: '💬' };
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.convCard}
                onPress={() => router.push(`/chat/${conv.id}` as any)}
                activeOpacity={0.7}>

                {/* ICÔNE GROUPE */}
                <View style={styles.iconWrapper}>
                  <View style={[styles.convIcon, { backgroundColor: cat.couleur }]}>
                    <Text style={styles.convEmoji}>{cat.emoji}</Text>
                  </View>
                  {/* INDICATEUR EN LIGNE */}
                  <View style={styles.onlineIndicator} />
                </View>

                {/* INFOS */}
                <View style={styles.convInfo}>
                  <View style={styles.convTop}>
                    <Text style={[styles.convTitre, conv.nonLu && styles.convTitreNonLu]} numberOfLines={1}>
                      {conv.titre}
                    </Text>
                    <Text style={[styles.convDate, conv.nonLu && styles.convDateNonLu]}>
                      {formatDate(conv.dernierMessageDate)}
                    </Text>
                  </View>
                  <View style={styles.convBottom}>
                    <Text style={[styles.convDernierMsg, conv.nonLu && styles.convDernierMsgNonLu]} numberOfLines={1}>
                      {conv.dernierMessage}
                    </Text>
                    <View style={styles.convMeta}>
                      {conv.nonLu && <View style={styles.nonLuBadge}><Text style={styles.nonLuTexte}>1</Text></View>}
                      <View style={[styles.convTag, { backgroundColor: cat.couleur + '22' }]}>
                        <Text style={[styles.convTagTexte, { color: cat.couleur }]}>
                          {conv.participants_count || 0} 👥
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  // HEADER
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  titre: { fontSize: 30, fontWeight: '900', color: '#1A1A1A', letterSpacing: -0.5 },
  sousTitre: { fontSize: 13, color: '#E8000D', fontWeight: '700', marginTop: 2 },
  headerRight: { flexDirection: 'row', gap: 8, marginTop: 8 },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { fontSize: 18 },

  // RECHERCHE
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EEE8DE', marginHorizontal: 20, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, gap: 10, marginBottom: 8 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#1A1A1A', fontWeight: '500' },
  searchClear: { fontSize: 16, color: '#AAA' },

  // FILTRES
  filtresScroll: { maxHeight: 46 },
  filtresContent: { paddingHorizontal: 20, gap: 8, paddingBottom: 8, alignItems: 'center' },
  filtreChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, backgroundColor: '#EEE8DE' },
  filtreChipActive: { backgroundColor: '#1A1A1A' },
  filtreChipTexte: { fontSize: 13, fontWeight: '700', color: '#AAA' },
  filtreChipTexteActive: { color: '#fff' },

  // LOADING / EMPTY
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 64 },
  emptyTexte: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#AAA', textAlign: 'center' },
  emptyBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // LISTE
  liste: { flex: 1 },

  // CONV CARD
  convCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 20 },
  iconWrapper: { position: 'relative' },
  convIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  convEmoji: { fontSize: 26 },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#1DB954', borderWidth: 2, borderColor: '#FAF7F2' },
  convInfo: { flex: 1, borderBottomWidth: 1, borderBottomColor: '#F0EDE8', paddingBottom: 10 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convTitre: { fontSize: 15, fontWeight: '600', color: '#1A1A1A', flex: 1, marginRight: 8 },
  convTitreNonLu: { fontWeight: '900' },
  convDate: { fontSize: 12, color: '#AAA', fontWeight: '500' },
  convDateNonLu: { color: '#E8000D', fontWeight: '700' },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convDernierMsg: { fontSize: 13, color: '#AAA', flex: 1, marginRight: 8 },
  convDernierMsgNonLu: { color: '#1A1A1A', fontWeight: '700' },
  convMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nonLuBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  nonLuTexte: { color: '#fff', fontSize: 11, fontWeight: '800' },
  convTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  convTagTexte: { fontSize: 11, fontWeight: '700' },
});