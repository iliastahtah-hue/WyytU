import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="inscription" options={{ headerShown: false }} />
      <Stack.Screen name="connexion" options={{ headerShown: false }} />
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