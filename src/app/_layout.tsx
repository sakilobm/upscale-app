import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { SplashOverlay } from '@components/SplashOverlay';
import { ToastContainer } from '@components/Toast';
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
  const themeMode = useThemeStore((s) => s.mode);
  const colors = themeMode === 'dark' ? DarkTheme : LightTheme;

  const [showSplash, setShowSplash] = useState(true);

  // Bootstrap demo user
  useEffect(() => {
    const t = setTimeout(() => setUser(DEMO_USER), 300);
    return () => clearTimeout(t);
  }, [setUser]);

  // Hide native splash as soon as fonts are ready, then let our overlay take over
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Hold the render tree until fonts are available to avoid FOUT
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="accounts" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="categories" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
      </Stack>
      <ToastContainer />
      {showSplash && (
        <SplashOverlay isDark={themeMode === 'dark'} onDismiss={() => setShowSplash(false)} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
