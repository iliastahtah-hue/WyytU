import { Redirect } from 'expo-router';

/** L'espace partenaire vit maintenant dans le mode Partenaire. */
export default function PartenaireRedirect() {
  return <Redirect href="/aujourdhui" />;
}
