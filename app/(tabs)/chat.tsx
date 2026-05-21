import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import TabBar from '../../components/TabBar';
import { supabase } from '../../lib/supabase';

type Conversation = {
  id: string;
  titre: string;
  categorie: string;
  dernierMessage?: string;
  dernierMessageDate?: string;
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

export default function ChatListScreen() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => { chargerConversations(); }, []);

  const chargerConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

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
            dernierMessage: msgs?.[0] ? `${msgs[0].prenom}: ${msgs[0].contenu}` : 'Aucun message',
            dernierMessageDate: msgs?.[0]?.created_at || null,
          };
        })
      );

      setConversations(avecMessages);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titre}>Messages 💬</Text>
        <Text style={styles.sousTitre}>{conversations.length} conversations actives</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E8000D" />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyTexte}>Aucune conversation</Text>
          <Text style={styles.emptySub}>Rejoins un plan pour commencer à chatter !</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(tabs)/explore' as any)}>
            <Text style={styles.emptyBtnTexte}>Explorer les plans →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
          {conversations.map((conv) => {
            const cat = CATEGORIES[conv.categorie] || { couleur: '#1A1A1A', emoji: '💬' };
            return (
              <TouchableOpacity
                key={conv.id}
                style={styles.convCard}
                onPress={() => router.push(`/chat/${conv.id}` as any)}>
                <View style={[styles.convIcon, { backgroundColor: cat.couleur }]}>
                  <Text style={styles.convEmoji}>{cat.emoji}</Text>
                </View>
                <View style={styles.convInfo}>
                  <View style={styles.convTop}>
                    <Text style={styles.convTitre} numberOfLines={1}>{conv.titre}</Text>
                    <Text style={styles.convDate}>{formatDate(conv.dernierMessageDate)}</Text>
                  </View>
                  <View style={styles.convBottom}>
                    <Text style={styles.convDernierMsg} numberOfLines={1}>{conv.dernierMessage}</Text>
                    <View style={[styles.convTag, { backgroundColor: cat.couleur + '22' }]}>
                      <Text style={[styles.convTagTexte, { color: cat.couleur }]}>{conv.participants_count || 0} 👥</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  titre: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5 },
  sousTitre: { fontSize: 13, color: '#AAA', marginTop: 4 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 60 },
  emptyTexte: { fontSize: 20, fontWeight: '800', color: '#1A1A1A' },
  emptySub: { fontSize: 14, color: '#AAA', textAlign: 'center' },
  emptyBtn: { backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 14, marginTop: 8 },
  emptyBtnTexte: { color: '#fff', fontSize: 14, fontWeight: '700' },
  liste: { flex: 1, paddingHorizontal: 20 },
  convCard: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#EEE8DE' },
  convIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  convEmoji: { fontSize: 24 },
  convInfo: { flex: 1 },
  convTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', flex: 1, marginRight: 8 },
  convDate: { fontSize: 11, color: '#AAA', fontWeight: '600' },
  convBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  convDernierMsg: { fontSize: 13, color: '#AAA', flex: 1, marginRight: 8 },
  convTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  convTagTexte: { fontSize: 11, fontWeight: '700' },
});