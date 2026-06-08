import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function CreerTab() {
  const router = useRouter();
  useEffect(() => { router.push('/creer-activite' as any); }, []);
  return <View />;
}