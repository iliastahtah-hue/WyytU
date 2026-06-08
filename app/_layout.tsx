import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(tabs)';
    const inPublic = segments[0] === 'connexion' || segments[0] === 'inscription' || segments[0] === 'mot-de-passe-oublie';
    if (!user && inAuthGroup) {
      router.replace('/connexion' as any);
    } else if (user && !inAuthGroup && !inPublic) {
      router.replace('/(tabs)/explore' as any);
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="inscription" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
      <Stack.Screen name="mot-de-passe-oublie" options={{ headerShown: false }} />
      <Stack.Screen name="matching" options={{ headerShown: false }} />
      <Stack.Screen name="creer-activite" options={{ headerShown: false }} />
      <Stack.Screen name="carte" options={{ headerShown: false }} />
      <Stack.Screen name="activite/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="appel/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="mes-activites" options={{ headerShown: false }} />
      <Stack.Screen name="profils/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}