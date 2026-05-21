import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import TabBar from '../../components/TabBar';
import { supabase } from '../../lib/supabase';

type Participant = {
  user_id: string;
  prenom: string;
};

export default function NoterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [notes, setNotes] = useState<Record<string, number>>({});
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [titreActivite, setTitreActivite] = useState('');
  const [loading, setLoading] = useState(true);
  const [envoyé, setEnvoyé] = useState(false);

  useEffect(() => { chargerDonnees(); }, []);

  const chargerDonnees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: activite } = await supabase.from('activites').select('titre').eq('id', id).single();
        if (activite) setTitreActivite(activite.titre);
        const { data: parts } = await supabase.from('participations').select('user_id').eq('activite_id', id);
        if (parts) {
          const autresIds = parts.map((p) => p.user_id).filter((uid) => uid !== user.id);
          const participantsList: Participant[] = [];
          for (const uid of autresIds) {
            const { data: u } = await supabase.from('utilisateurs').select('prenom').eq('id', uid).single();
            if (u) participantsList.push({ user_id: uid, prenom: u.prenom });
          }
          setParticipants(participantsList);
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const setNote = (uid: string, note: number) => setNotes((prev) => ({ ...prev, [uid]: note }));
  const setCommentaire = (uid: string, texte: string) => setCommentaires((prev) => ({ ...prev, [uid]: texte }));

  const envoyerNotes = async () => {
    if (!userId) return;
    const notesAEnvoyer = participants.filter((p) => notes[p.user_id]);
    if (notesAEnvoyer.length === 0) { Alert.alert('Info', 'Note au moins un participant !'); return; }
    try {
      for (const p of notesAEnvoyer) {
        await supabase.from('notations').insert({
          activite_id: id, noteur_id: userId, note_cible_id: p.user_id,
          note: notes[p.user_id], commentaire: commentaires[p.user_id] || null,
        });
        const { data: toutesNotes } = await supabase.from('notations').select('note').eq('note_cible_id', p.user_id);
        if (toutesNotes) {
          const moyenne = toutesNotes.reduce((acc, n) => acc + n.note, 0) / toutesNotes.length;
          await supabase.from('utilisateurs').update({ note_moyenne: Math.round(moyenne * 10) / 10 }).eq('id', p.user_id);
        }
      }
      setEnvoyé(true);
      Alert.alert('🎉 Merci !', 'Tes notes ont été envoyées !', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  };

  const EtoilesNote = ({ userId: uid, note }: { userId: string; note: number }) => (
    <View style={styles.etoilesRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setNote(uid, star)}>
          <Text style={[styles.etoile, note >= star && styles.etoileActive]}>★</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return <View style={styles.loadingContainer}><Text style={styles.loadingTexte}>Chargement... 🔄</Text></View>;
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitre}>Noter les participants</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.introEmoji}>⭐</Text>
          <Text style={styles.introTitre}>Comment s'est passé le plan ?</Text>
          <Text style={styles.introSub} numberOfLines={2}>{titreActivite}</Text>
        </View>

        {participants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>😔</Text>
            <Text style={styles.emptyTexte}>Aucun participant à noter</Text>
          </View>
        ) : (
          <View style={styles.participantsList}>
            {participants.map((p) => (
              <View key={p.user_id} style={styles.participantCard}>
                <View style={styles.participantHeader}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarTexte}>{p.prenom?.[0]?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantNom}>{p.prenom}</Text>
                    <Text style={styles.participantSub}>{notes[p.user_id] ? `${notes[p.user_id]}/5 ⭐` : 'Pas encore noté'}</Text>
                  </View>
                </View>
                <EtoilesNote userId={p.user_id} note={notes[p.user_id] || 0} />
                <TextInput
                  style={styles.commentaireInput}
                  placeholder="Un commentaire ? (optionnel)"
                  placeholderTextColor="#BBB"
                  value={commentaires[p.user_id] || ''}
                  onChangeText={(t) => setCommentaire(p.user_id, t)}
                  multiline
                />
              </View>
            ))}
          </View>
        )}

        {participants.length > 0 && (
          <TouchableOpacity style={[styles.bouton, envoyé && styles.boutonDisabled]} onPress={envoyerNotes} disabled={envoyé}>
            <Text style={styles.boutonTexte}>{envoyé ? '✅ Notes envoyées !' : '⭐ Envoyer mes notes'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },
  loadingContainer: { flex: 1, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  loadingTexte: { color: '#AAA', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE8DE', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DDD4C4' },
  backIcon: { fontSize: 20, color: '#1A1A1A' },
  headerTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A' },
  intro: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20 },
  introEmoji: { fontSize: 52, marginBottom: 12 },
  introTitre: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 6, textAlign: 'center' },
  introSub: { fontSize: 14, color: '#AAA', textAlign: 'center' },
  emptyContainer: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTexte: { fontSize: 16, color: '#AAA', fontWeight: '600' },
  participantsList: { paddingHorizontal: 20, gap: 14 },
  participantCard: { backgroundColor: '#EEE8DE', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#DDD4C4' },
  participantHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  participantAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E8000D', alignItems: 'center', justifyContent: 'center' },
  participantAvatarTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  participantInfo: { flex: 1 },
  participantNom: { fontSize: 16, fontWeight: '800', color: '#1A1A1A' },
  participantSub: { fontSize: 12, color: '#AAA', marginTop: 2 },
  etoilesRow: { flexDirection: 'row', gap: 8, marginBottom: 14, justifyContent: 'center' },
  etoile: { fontSize: 36, color: '#DDD4C4' },
  etoileActive: { color: '#FF9500' },
  commentaireInput: { backgroundColor: '#FAF7F2', borderRadius: 12, padding: 12, color: '#1A1A1A', fontSize: 14, borderWidth: 1, borderColor: '#DDD4C4', minHeight: 60, textAlignVertical: 'top' },
  bouton: { backgroundColor: '#FF9500', borderRadius: 20, padding: 18, alignItems: 'center', marginHorizontal: 20, marginTop: 24 },
  boutonDisabled: { backgroundColor: '#AAA' },
  boutonTexte: { color: '#fff', fontSize: 16, fontWeight: '800' },
});