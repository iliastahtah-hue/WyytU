import { StyleSheet, View } from 'react-native';
import { AppText, Screen, TopBar } from '@/src/components/ui';
import { useI18n } from '@/src/i18n';
import { colors, radius } from '@/src/theme/tokens';

/**
 * Résumé lisible des règles. Le texte juridique complet (CGU, politique de
 * confidentialité, mentions CNDP) doit être rédigé et validé par un avocat
 * marocain, puis publié sur le site et lié ici.
 */
const SECTIONS: [string, string][] = [
  ['Qui peut utiliser WyytU', 'WyytU est réservé aux personnes de 18 ans et plus. Un compte par personne, avec ta vraie identité.'],
  ['Les règles de la communauté', 'Respect, bienveillance, pas de drague insistante : WyytU n’est pas une app de rencontre. Tout comportement déplacé peut entraîner la suspension du compte.'],
  ['Tes données', 'On collecte ton numéro ou ton e-mail, ton profil, tes photos et ton selfie de vérification. Le selfie sert uniquement à vérifier ton identité et est supprimé après vérification. Ta position n’est jamais montrée aux autres membres.'],
  ['Tes droits', 'Tu peux consulter, corriger ou supprimer tes données à tout moment, et supprimer ton compte depuis les réglages. Déclaration CNDP n° [NUMÉRO CNDP].'],
  ['Notes et avis', 'Seuls les membres présents à une sortie peuvent se noter. Les avis écrits sont relus par notre équipe avant publication.'],
  ['Paiements', 'Les sorties se paient sur place, directement au lieu. L’abonnement Premium passe par l’App Store ou Google Play.'],
  ['Contact', 'Une question, un problème : [E-MAIL DE CONTACT].'],
];

export default function LegalScreen() {
  const { t, lang } = useI18n();
  return (
    <Screen scroll>
      <TopBar title={t('settings.legal')} />
      <AppText variant="small" color={colors.sub} style={{ marginBottom: 12 }}>Dernière mise à jour : [DATE]</AppText>
      {lang !== 'fr' ? <AppText variant="small" color={colors.sub} style={{ marginBottom: 12 }}>{t('legalNote.frenchOnly')}</AppText> : null}
      <View style={{ gap: 10 }}>
        {SECTIONS.map(([title, body]) => (
          <View key={title} style={styles.card}>
            <AppText variant="heading">{title}</AppText>
            <AppText color={colors.sub}>{body}</AppText>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, gap: 6 },
});
