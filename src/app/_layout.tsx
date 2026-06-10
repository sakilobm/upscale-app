import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { LoadingScreen } from '@components/LoadingScreen';
import { DarkTheme, LightTheme } from '@constants/themes';
import type { User } from '@store/types';

SplashScreen.preventAutoHideAsync();

const DEMO_USER: User = {
  id: 'user-1',
  email: 'master@gmail.com',
  fullName: 'Sakil Master',
  avatarUrl: null,
  currency: 'USD',
  createdAt: '2024-01-01T00:00:00Z',
};

export default function RootLayout() {
  const { fontsLoaded, fontError } = useCachedFonts();
  const setUser = useAuthStore((s) => s.setUser);
  const isLoading = useAuthStore((s) => s.isLoading);
  const themeMode = useThemeStore((s) => s.mode);
  const colors = themeMode === 'dark' ? DarkTheme : LightTheme;

  useEffect(() => {
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
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
