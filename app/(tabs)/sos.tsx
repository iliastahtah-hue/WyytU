import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function SOSScreen() {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [ville, setVille] = useState('Localisation en cours...');
  const [locLoading, setLocLoading] = useState(true);
  const [sosActif, setSosActif] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const contactsConfiance = [
    { prenom: 'Maman', telephone: '+212 6XX XXX XXX', relation: 'Famille', couleur: '#E8000D' },
    { prenom: 'Ahmed', telephone: '+32 4XX XXX XXX', relation: 'Ami proche', couleur: '#0070F3' },
    { prenom: 'Sara', telephone: '+212 6XX XXX XXX', relation: 'Amie proche', couleur: '#FF4B7D' },
  ];

  useEffect(() => {
    chargerPosition();
    demarrerPulse();
  }, []);

  const demarrerPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  };

  const chargerPosition = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setVille('Position non disponible');
        setLocLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude });

      const [adresse] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (adresse) {
        const villeNom = adresse.city || adresse.subregion || adresse.region || 'Ville inconnue';
        const quartier = adresse.district || adresse.street || '';
        setVille(quartier ? `${quartier}, ${villeNom}` : villeNom);
      }
    } catch (err) {
      setVille('Position non disponible');
    } finally {
      setLocLoading(false);
    }
  };

  const activerSOS = () => {
    Alert.alert(
      '🆘 Activer le SOS ?',
      'Ta position GPS sera envoyée à tes contacts de confiance immédiatement.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'ACTIVER',
          style: 'destructive',
          onPress: () => {
            setSosActif(true);
            Alert.alert('✅ SOS activé', 'Ta position a été envoyée à tes contacts de confiance.');
          },
        },
      ]
    );
  };

  const regles = [
    { icon: '🪪', texte: 'Tous les membres sont vérifiés par carte d\'identité' },
    { icon: '📋', texte: 'Chaque activité est enregistrée — qui, où, quand' },
    { icon: '⚡', texte: 'Les signalements sont traités sous 24h' },
    { icon: '🔒', texte: 'Ton numéro reste privé jusqu\'à l\'activité' },
    { icon: '🚫', texte: 'Tu peux bloquer n\'importe quel membre en un clic' },
    { icon: '👮', texte: 'Les cas graves sont transmis aux autorités' },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Sécurité</Text>
        <Text style={styles.sousTitre}>Ta sécurité est notre priorité absolue</Text>
      </View>

      {/* BOUTON SOS */}
      <View style={styles.sosSection}>
        <Text style={styles.sosLabel}>EN CAS DE DANGER</Text>
        <Text style={styles.sosDesc}>
          Ta position GPS sera envoyée instantanément à tes contacts de confiance
        </Text>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[styles.boutonSOS, sosActif && styles.boutonSOSActif]}
            onPress={activerSOS}>
            <View style={styles.sosInner}>
              <Text style={styles.sosIcon}>🆘</Text>
              <Text style={styles.sosTexte}>SOS</Text>
              <Text style={styles.sosSub}>Appuyer pour activer</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
        {sosActif && (
          <View style={styles.sosActifBadge}>
            <View style={styles.sosActifDot} />
            <Text style={styles.sosActifTexte}>SOS actif — position partagée</Text>
          </View>
        )}
      </View>

      {/* POSITION GPS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>📍 Ta position actuelle</Text>
        <View style={styles.positionCard}>
          <View style={styles.positionTop}>
            <View style={styles.positionIconWrapper}>
              <Text style={styles.positionIcon}>🗺️</Text>
            </View>
            <View style={styles.positionInfo}>
              <Text style={styles.positionVille}>{ville}</Text>
              {position && (
                <Text style={styles.positionCoords}>
                  {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.refreshBtn} onPress={chargerPosition}>
              <Text style={styles.refreshIcon}>{locLoading ? '⏳' : '🔄'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.positionStatusRow}>
            <View style={[styles.statusDot, { backgroundColor: position ? '#1DB954' : '#AAA' }]} />
            <Text style={[styles.statusTexte, { color: position ? '#1DB954' : '#AAA' }]}>
              {position ? 'Position GPS active' : 'GPS non disponible'}
            </Text>
          </View>
        </View>
      </View>

      {/* CONTACTS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>👥 Contacts de confiance</Text>
        <Text style={styles.sectionSub}>Ces personnes recevront ta position en cas d'urgence</Text>
        <View style={styles.contactsList}>
          {contactsConfiance.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={[styles.contactAvatar, { backgroundColor: contact.couleur }]}>
                <Text style={styles.contactAvatarTexte}>{contact.prenom[0]}</Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactPrenom}>{contact.prenom}</Text>
                <Text style={styles.contactTel}>{contact.telephone}</Text>
                <View style={[styles.contactRelTag, { backgroundColor: contact.couleur + '22' }]}>
                  <Text style={[styles.contactRelTexte, { color: contact.couleur }]}>
                    {contact.relation}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={[styles.appelBtn, { backgroundColor: contact.couleur }]}>
                <Text style={styles.appelBtnTexte}>📞</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.ajouterBtn}>
          <Text style={styles.ajouterBtnTexte}>➕ Ajouter un contact</Text>
        </TouchableOpacity>
      </View>

      {/* REGLES */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>🛡️ Règles de sécurité WyytU</Text>
        <View style={styles.reglesList}>
          {regles.map((regle, index) => (
            <View key={index} style={styles.regleCard}>
              <Text style={styles.regleIcon}>{regle.icon}</Text>
              <Text style={styles.regleTexte}>{regle.texte}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SIGNALER */}
      <View style={styles.section}>
        <Text style={styles.sectionTitre}>🚨 Signaler un problème</Text>
        <TouchableOpacity style={styles.signalerBtn}>
          <Text style={styles.signalerBtnTexte}>🚨 Signaler un utilisateur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.urgenceBtn}>
          <Text style={styles.urgenceBtnTexte}>🚔 Contacter les autorités</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAF7F2' },

  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  logo: { fontSize: 26, fontWeight: '800', color: '#1A1A1A', letterSpacing: 1, marginBottom: 8 },
  titre: { fontSize: 28, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.5, marginBottom: 4 },
  sousTitre: { fontSize: 14, color: '#AAA', fontStyle: 'italic', textAlign: 'center' },

  sosSection: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, backgroundColor: '#FFF5F5', marginHorizontal: 20, borderRadius: 24, marginBottom: 8, borderWidth: 1.5, borderColor: '#FFD0D0' },
  sosLabel: { fontSize: 11, fontWeight: '800', color: '#E8000D', letterSpacing: 2, marginBottom: 8 },
  sosDesc: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24, lineHeight: 18 },
  boutonSOS: {
    width: 170, height: 170, borderRadius: 85,
    backgroundColor: '#E8000D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#E8000D', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20,
    borderWidth: 6, borderColor: '#FF4444',
  },
  boutonSOSActif: { backgroundColor: '#1DB954', borderColor: '#27AE60' },
  sosInner: { alignItems: 'center' },
  sosIcon: { fontSize: 44 },
  sosTexte: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4, letterSpacing: 2 },
  sosSub: { color: 'rgba(255,255,255,0.75)', fontSize: 10, marginTop: 2 },
  sosActifBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, backgroundColor: '#EEF7EE', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: '#1DB954' },
  sosActifDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1DB954' },
  sosActifTexte: { color: '#1DB954', fontSize: 12, fontWeight: '700' },

  section: { paddingHorizontal: 20, marginTop: 24 },
  sectionTitre: { fontSize: 17, fontWeight: '800', color: '#1A1A1A', marginBottom: 12, letterSpacing: -0.3 },
  sectionSub: { fontSize: 13, color: '#AAA', marginBottom: 14, marginTop: -8 },

  positionCard: { backgroundColor: '#EEE8DE', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#DDD4C4' },
  positionTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  positionIconWrapper: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  positionIcon: { fontSize: 22 },
  positionInfo: { flex: 1 },
  positionVille: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  positionCoords: { fontSize: 11, color: '#AAA', marginTop: 2 },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FAF7F2', alignItems: 'center', justifyContent: 'center' },
  refreshIcon: { fontSize: 16 },
  positionStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusTexte: { fontSize: 12, fontWeight: '600' },

  contactsList: { gap: 10 },
  contactCard: { backgroundColor: '#EEE8DE', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDD4C4' },
  contactAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  contactAvatarTexte: { color: '#fff', fontSize: 20, fontWeight: '800' },
  contactInfo: { flex: 1 },
  contactPrenom: { fontSize: 15, fontWeight: '700', color: '#1A1A1A' },
  contactTel: { fontSize: 12, color: '#AAA', marginTop: 2 },
  contactRelTag: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start', marginTop: 4 },
  contactRelTexte: { fontSize: 11, fontWeight: '700' },
  appelBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  appelBtnTexte: { fontSize: 18 },
  ajouterBtn: { marginTop: 10, backgroundColor: '#EEE8DE', borderRadius: 16, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#1A1A1A' },
  ajouterBtnTexte: { color: '#1A1A1A', fontWeight: '800', fontSize: 14 },

  reglesList: { gap: 8 },
  regleCard: { backgroundColor: '#EEE8DE', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#DDD4C4' },
  regleIcon: { fontSize: 20 },
  regleTexte: { color: '#555', fontSize: 13, lineHeight: 18, flex: 1 },

  signalerBtn: { backgroundColor: '#E8000D', borderRadius: 16, padding: 16, alignItems: 'center', marginBottom: 10 },
  signalerBtnTexte: { color: '#fff', fontWeight: '800', fontSize: 15 },
  urgenceBtn: { backgroundColor: '#EEE8DE', borderRadius: 16, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#E8000D' },
  urgenceBtnTexte: { color: '#E8000D', fontWeight: '800', fontSize: 15 },
});