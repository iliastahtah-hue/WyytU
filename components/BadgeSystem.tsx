import { StyleSheet, Text, View } from 'react-native';

export type Badge = {
  id: string;
  emoji: string;
  nom: string;
  description: string;
  couleur: string;
  obtenu: boolean;
};

export const calculerBadges = (user: {
  nb_sorties?: number;
  nb_organise?: number;
  note_moyenne?: number;
  taux_presence?: number;
  activites_favorites?: string;
}): Badge[] => {
  const sorties = user.nb_sorties || 0;
  const organise = user.nb_organise || 0;
  const note = user.note_moyenne || 0;
  const presence = user.taux_presence || 100;

  return [
    {
      id: 'fiable',
      emoji: '🟢',
      nom: 'Fiable',
      description: 'Jamais annulé',
      couleur: '#1DB954',
      obtenu: presence >= 100 && sorties >= 1,
    },
    {
      id: 'organisateur',
      emoji: '👑',
      nom: 'Organisateur',
      description: 'A organisé 3+ plans',
      couleur: '#FF9500',
      obtenu: organise >= 3,
    },
    {
      id: 'ponctuel',
      emoji: '⏰',
      nom: 'Ponctuel',
      description: 'Toujours à l\'heure',
      couleur: '#0070F3',
      obtenu: note >= 4.5 && sorties >= 3,
    },
    {
      id: 'ambianceur',
      emoji: '🔥',
      nom: 'Ambianceur',
      description: 'Note moyenne 4.8+',
      couleur: '#E8000D',
      obtenu: note >= 4.8,
    },
    {
      id: 'explorateur',
      emoji: '🌍',
      nom: 'Explorateur',
      description: '10+ sorties réalisées',
      couleur: '#00B4D8',
      obtenu: sorties >= 10,
    },
    {
      id: 'social',
      emoji: '👥',
      nom: 'Social',
      description: '5+ plans rejoints',
      couleur: '#FF4B7D',
      obtenu: sorties >= 5,
    },
    {
      id: 'sportif',
      emoji: '⚡',
      nom: 'Sportif',
      description: 'Fan de sport',
      couleur: '#E8000D',
      obtenu: (user.activites_favorites || '').toLowerCase().includes('sport'),
    },
    {
      id: 'premium',
      emoji: '💎',
      nom: 'Premium',
      description: 'Membre vérifié actif',
      couleur: '#7B2FBE',
      obtenu: sorties >= 1,
    },
    {
      id: 'rookie',
      emoji: '🌟',
      nom: 'Nouveau',
      description: 'Bienvenue sur WyytU !',
      couleur: '#FFD600',
      obtenu: true,
    },
    {
      id: 'mega',
      emoji: '🏆',
      nom: 'Légende',
      description: '20+ sorties + note 4.9+',
      couleur: '#FF9500',
      obtenu: sorties >= 20 && note >= 4.9,
    },
  ];
};

type Props = {
  user: {
    nb_sorties?: number;
    nb_organise?: number;
    note_moyenne?: number;
    taux_presence?: number;
    activites_favorites?: string;
  };
  mode?: 'full' | 'compact';
};

export default function BadgeSystem({ user, mode = 'full' }: Props) {
  const badges = calculerBadges(user);
  const obtenus = badges.filter((b) => b.obtenu);
  const nonObtenus = badges.filter((b) => !b.obtenu);

  if (mode === 'compact') {
    return (
      <View style={styles.compactRow}>
        {obtenus.slice(0, 5).map((b) => (
          <View key={b.id} style={[styles.compactBadge, { backgroundColor: b.couleur + '20', borderColor: b.couleur + '40' }]}>
            <Text style={styles.compactEmoji}>{b.emoji}</Text>
            <Text style={[styles.compactNom, { color: b.couleur }]}>{b.nom}</Text>
          </View>
        ))}
        {obtenus.length > 5 && (
          <View style={styles.compactMore}>
            <Text style={styles.compactMoreTexte}>+{obtenus.length - 5}</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <View>
      {/* STATS BADGES */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{obtenus.length}</Text>
          <Text style={styles.statLabel}>Obtenus</Text>
        </View>
        <View style={[styles.statCard, styles.statCardCenter]}>
          <Text style={[styles.statNombre, { color: '#E8000D' }]}>{badges.length - obtenus.length}</Text>
          <Text style={styles.statLabel}>À débloquer</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNombre}>{Math.round((obtenus.length / badges.length) * 100)}%</Text>
          <Text style={styles.statLabel}>Complété</Text>
        </View>
      </View>

      {/* BARRE PROGRESSION */}
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Progression des badges</Text>
          <Text style={styles.progressPct}>{obtenus.length}/{badges.length}</Text>
        </View>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${(obtenus.length / badges.length) * 100}%` as any }]} />
        </View>
      </View>

      {/* BADGES OBTENUS */}
      {obtenus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>✅ Badges obtenus</Text>
          <View style={styles.badgesGrid}>
            {obtenus.map((b) => (
              <View key={b.id} style={[styles.badgeCard, { borderColor: b.couleur + '40', backgroundColor: b.couleur + '12' }]}>
                <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                <Text style={[styles.badgeNom, { color: b.couleur }]}>{b.nom}</Text>
                <Text style={styles.badgeDesc}>{b.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* BADGES À DÉBLOQUER */}
      {nonObtenus.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitre}>🔒 À débloquer</Text>
          <View style={styles.badgesGrid}>
            {nonObtenus.map((b) => (
              <View key={b.id} style={styles.badgeCardLocked}>
                <Text style={styles.badgeEmojiLocked}>{b.emoji}</Text>
                <Text style={styles.badgeNomLocked}>{b.nom}</Text>
                <Text style={styles.badgeDescLocked}>{b.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // COMPACT
  compactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  compactBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  compactEmoji: { fontSize: 14 },
  compactNom: { fontSize: 11, fontWeight: '700' },
  compactMore: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: '#EEE8DE' },
  compactMoreTexte: { fontSize: 11, fontWeight: '700', color: '#AAA' },

  // STATS
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  statCardCenter: { borderWidth: 2, borderColor: '#E8000D' },
  statNombre: { fontSize: 20, fontWeight: '900', color: '#1A1A1A' },
  statLabel: { color: '#AAA', fontSize: 10, marginTop: 3, fontWeight: '600' },

  // PROGRESSION
  progressCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressLabel: { fontSize: 13, color: '#AAA', fontWeight: '600' },
  progressPct: { fontSize: 13, fontWeight: '800', color: '#E8000D' },
  progressBg: { height: 8, backgroundColor: '#EEE8DE', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: '#E8000D', borderRadius: 4 },

  // SECTION
  section: { marginBottom: 20 },
  sectionTitre: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', marginBottom: 12 },

  // BADGES GRID
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeCard: { borderRadius: 16, padding: 14, alignItems: 'center', width: '30%', borderWidth: 1.5 },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeNom: { fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 3 },
  badgeDesc: { fontSize: 9, color: '#AAA', textAlign: 'center', lineHeight: 13 },

  // LOCKED
  badgeCardLocked: { borderRadius: 16, padding: 14, alignItems: 'center', width: '30%', backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#EEE', opacity: 0.6 },
  badgeEmojiLocked: { fontSize: 28, marginBottom: 6, opacity: 0.3 },
  badgeNomLocked: { fontSize: 11, fontWeight: '800', textAlign: 'center', marginBottom: 3, color: '#AAA' },
  badgeDescLocked: { fontSize: 9, color: '#CCC', textAlign: 'center', lineHeight: 13 },
});