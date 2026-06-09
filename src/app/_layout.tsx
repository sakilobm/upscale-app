import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { LoadingScreen } from '@components/LoadingScreen';
import { Colors } from '@constants/index';
import type { User } from '@store/types';

SplashScreen.preventAutoHideAsync();

// Seed a mock authenticated user immediately for demo purposes
const DEMO_USER: User = {
  id: 'user-1',
  email: 'demo@moneyapp.com',
  fullName: 'Alex Morgan',
  avatarUrl: null,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
};

export default function RootLayout() {
  const { fontsLoaded, fontError } = useCachedFonts();
  const setUser = useAuthStore((s) => s.setUser);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    // Simulate auth session restore
    const timer = setTimeout(() => {
      setUser(DEMO_USER);
    }, 300);
    return () => clearTimeout(timer);
  }, [setUser]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded || isLoading) {
    return <LoadingScreen message="Starting up..." />;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
});
