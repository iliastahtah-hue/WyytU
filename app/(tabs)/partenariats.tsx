import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PartenariatsScreen() {

  const partenaires = [
    {
      nom: 'Dako\'tah Restaurant',
      categorie: '🍽️ Restaurant',
      ville: 'Tanger, Maroc',
      offre: '-15% sur l\'addition',
      description: 'Pour tout groupe de 3 personnes ou plus via WyytU',
      couleur: '#F39C12',
      badge: '⭐ Partenaire Fondateur',
    },
    {
      nom: 'Café Hafa',
      categorie: '☕ Café Historique',
      ville: 'Tanger, Maroc',
      offre: '1 thé offert par personne',
      description: 'Pour tout groupe de 3 personnes ou plus',
      couleur: '#27AE60',
      badge: '☕ Iconique',
    },
    {
      nom: 'Five Fitness Club',
      categorie: '🏋️ Salle de sport',
      ville: 'Tanger, Maroc',
      offre: 'Séance d\'essai gratuite',
      description: 'Pour tout nouveau groupe venant via WyytU',
      couleur: '#FF4444',
      badge: '🏋️ Sport',
    },
    {
      nom: 'Plage Achakar',
      categorie: '🏖️ Beach Club',
      ville: 'Tanger, Maroc',
      offre: 'Accès VIP offert',
      description: 'Pour tout groupe de 4 personnes via WyytU',
      couleur: '#F39C12',
      badge: '🏖️ Summer',
    },
    {
      nom: 'Karting Tanger',
      categorie: '🏎️ Karting',
      ville: 'Tanger, Maroc',
      offre: '-30% sur la session',
      description: 'Pour tout groupe complet réservé via WyytU',
      couleur: '#00BCD4',
      badge: '🔥 Fun',
    },
    {
      nom: 'VIP Club Tanger',
      categorie: '🌙 Discothèque',
      ville: 'Tanger, Maroc',
      offre: 'Entrée gratuite jusqu\'à minuit',
      description: 'Pour tout groupe WyytU de 3 personnes ou plus',
      couleur: '#673AB7',
      badge: '💎 VIP',
    },
    {
      nom: 'Bowling Tanger City Mall',
      categorie: '🎳 Bowling',
      ville: 'Tanger, Maroc',
      offre: '1 partie offerte sur 2',
      description: 'Pour tout groupe de 4 personnes ou plus',
      couleur: '#27AE60',
      badge: '🎳 Fun',
    },
    {
      nom: 'Restaurant Populaire',
      categorie: '🍽️ Cuisine Marocaine',
      ville: 'Tanger, Maroc',
      offre: '-15% sur le menu',
      description: 'Tajines, couscous, pastilla pour tout groupe WyytU',
      couleur: '#E74C3C',
      badge: '🇲🇦 Authentique',
    },
    {
      nom: 'Megarama Cinéma',
      categorie: '🎬 Cinéma',
      ville: 'Casablanca & Rabat',
      offre: '-25% sur les billets',
      description: 'Pour tout groupe de 4 personnes via WyytU',
      couleur: '#3498DB',
      badge: '🎬 Cinéma',
    },
    {
      nom: 'Morocco Mall',
      categorie: '🛍️ Shopping',
      ville: 'Casablanca, Maroc',
      offre: '-10% dans les boutiques partenaires',
      description: 'Sur présentation de ton profil WyytU vérifié',
      couleur: '#E91E63',
      badge: '🔥 Populaire',
    },
    {
      nom: 'Sky Bar Casablanca',
      categorie: '🌙 Rooftop Bar',
      ville: 'Casablanca, Maroc',
      offre: '-20% sur les consommations',
      description: 'Vue panoramique sur Casa — groupes de 3 via WyytU',
      couleur: '#00BCD4',
      badge: '🌟 Rooftop',
    },
    {
      nom: 'Escape Game Maroc',
      categorie: '🎮 Escape Game',
      ville: 'Casablanca, Maroc',
      offre: '-30% sur la session',
      description: 'Pour tout groupe complet via WyytU',
      couleur: '#8E44AD',
      badge: '💎 Exclusif',
    },
    {
      nom: 'Moga Festival',
      categorie: '🎵 Festival Electronic',
      ville: 'Essaouira, Maroc',
      offre: '-25% sur les billets',
      description: 'Le plus grand festival électronique du Maroc — groupes de 4 via WyytU',
      couleur: '#E91E63',
      badge: '🔥 Incontournable',
    },
    {
      nom: 'Jazzablanca Festival',
      categorie: '🎷 Festival Jazz',
      ville: 'Casablanca, Maroc',
      offre: '-20% sur les billets VIP',
      description: 'Pour tout groupe de 3 personnes formé via WyytU',
      couleur: '#9B59B6',
      badge: '⭐ Prestige',
    },
    {
      nom: 'Boulevard Festival',
      categorie: '🎤 Hip-Hop & Urbain',
      ville: 'Casablanca, Maroc',
      offre: '-15% sur les billets',
      description: 'Le festival urbain numéro 1 du Maroc — groupes via WyytU',
      couleur: '#FF4444',
      badge: '🎤 Urban',
    },
    {
      nom: 'Festival Mawazine',
      categorie: '🎵 Festival',
      ville: 'Rabat, Maroc',
      offre: '-20% sur les billets',
      description: 'Pour tout groupe de 5 personnes formé via WyytU',
      couleur: '#FF6B2B',
      badge: '🎵 Festival',
    },
    {
      nom: 'Pacha Marrakech',
      categorie: '🌙 Discothèque',
      ville: 'Marrakech, Maroc',
      offre: 'Entrée gratuite + 1 verre offert',
      description: 'Pour tout groupe de 4 personnes réservant via WyytU',
      couleur: '#8E44AD',
      badge: '🌙 Night',
    },
    {
      nom: 'Amnesia Club',
      categorie: '🌙 Discothèque',
      ville: 'Marrakech, Maroc',
      offre: '2 entrées offertes sur 4',
      description: 'Pour tout groupe de 4 personnes formé via WyytU',
      couleur: '#E91E63',
      badge: '🔥 Populaire',
    },
    {
      nom: 'Hammam Ziani',
      categorie: '💆 Hammam & Spa',
      ville: 'Marrakech, Maroc',
      offre: '-20% sur les soins',
      description: 'Pour tout groupe de 3 personnes réservant via WyytU',
      couleur: '#9B59B6',
      badge: '💎 Exclusif',
    },
  ];

  const categories = ['Tous', '🏋️ Sport', '🎬 Cinéma', '🍽️ Resto', '🎵 Festival', '🌙 Soirée', '🏖️ Beach'];

  return (
    <ScrollView style={styles.container}>

      <View style={styles.header}>
        <Text style={styles.logo}>WyytU</Text>
        <Text style={styles.titre}>Offres exclusives 🎁</Text>
        <Text style={styles.sousTitre}>
          Des réductions au Maroc et partout ! 🇲🇦
        </Text>
      </View>

      <View style={styles.premiumBanner}>
        <Text style={styles.premiumTexte}>
          💎 Premium — Accède à toutes les offres exclusives
        </Text>
        <TouchableOpacity style={styles.premiumBouton}>
          <Text style={styles.premiumBoutonTexte}>7,99€/mois</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContainer}>
        {categories.map((cat, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.categorieTag, index === 0 && styles.categorieTagActive]}>
            <Text style={[styles.categorieTexte, index === 0 && styles.categorieTexteActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.partenairesContainer}>
        {partenaires.map((partenaire, index) => (
          <View key={index} style={[styles.partenaireCard, { borderLeftColor: partenaire.couleur, borderLeftWidth: 4 }]}>

            <View style={styles.partenaireHeader}>
              <View style={styles.partenaireInfos}>
                <Text style={styles.partenaireNom}>{partenaire.nom}</Text>
                <Text style={styles.partenaireCategorie}>{partenaire.categorie}</Text>
                <Text style={styles.partenaireVille}>📍 {partenaire.ville}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: partenaire.couleur + '33', borderColor: partenaire.couleur }]}>
                <Text style={[styles.badgeTexte, { color: partenaire.couleur }]}>
                  {partenaire.badge}
                </Text>
              </View>
            </View>

            <Text style={styles.offre}>{partenaire.offre}</Text>
            <Text style={styles.description}>{partenaire.description}</Text>

            <TouchableOpacity style={[styles.boutonProfiter, { backgroundColor: partenaire.couleur }]}>
              <Text style={styles.boutonProfiterTexte}>
                Profiter de l'offre 🎁
              </Text>
            </TouchableOpacity>

          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A2E5A',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  titre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  sousTitre: {
    fontSize: 14,
    color: '#FF6B2B',
    marginTop: 6,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  premiumBanner: {
    backgroundColor: '#1E3A6E',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FF6B2B',
  },
  premiumTexte: {
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  premiumBouton: {
    backgroundColor: '#FF6B2B',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  premiumBoutonTexte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  categoriesScroll: {
    marginBottom: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categorieTag: {
    backgroundColor: '#243660',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  categorieTagActive: {
    backgroundColor: '#FF6B2B',
    borderColor: '#FF6B2B',
  },
  categorieTexte: {
    color: '#AAAAAA',
    fontSize: 13,
    fontWeight: 'bold',
  },
  categorieTexteActive: {
    color: '#FFFFFF',
  },
  partenairesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 14,
  },
  partenaireCard: {
    backgroundColor: '#243660',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#2B4C9B',
  },
  partenaireHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  partenaireInfos: {
    flex: 1,
    marginRight: 10,
  },
  partenaireNom: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  partenaireCategorie: {
    color: '#AAAAAA',
    fontSize: 13,
    marginTop: 2,
  },
  partenaireVille: {
    color: '#FF6B2B',
    fontSize: 12,
    marginTop: 2,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  badgeTexte: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  offre: {
    color: '#FF6B2B',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    color: '#AAAAAA',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  boutonProfiter: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  boutonProfiterTexte: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});