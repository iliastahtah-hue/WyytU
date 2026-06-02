import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function CarteTab() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/carte' as any);
  }, []);
  return <View />;
}