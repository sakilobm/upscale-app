import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, SplashScreen, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { useNotificationStore } from '@store/notificationStore';
import { SplashOverlay } from '@components/SplashOverlay';
import { ToastContainer } from '@components/Toast';
import { DarkTheme, LightTheme } from '@constants/themes';
import { applyGlobalHapticPatch } from '@/services/hapticsService';

applyGlobalHapticPatch();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fontsLoaded, fontError } = useCachedFonts();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading       = useAuthStore((s) => s.isLoading);
  const themeMode = useThemeStore((s) => s.mode);
  const colors    = themeMode === 'dark' ? DarkTheme : LightTheme;

  const addNotification = useNotificationStore((s) => s.addNotification);
  const setPermission   = useNotificationStore((s) => s.setPermission);

  const [showSplash, setShowSplash] = useState(true);

  // Setup notifications lazily. notificationService.ts guards its own
  // import('expo-notifications') behind an IS_EXPO_GO check, so the
  // DevicePushTokenAutoRegistration.fx.js side-effect never runs in Expo Go.
  useEffect(() => {
    let sub: { remove: () => void } | null = null;

    (async () => {
      try {
        const {
          setupNotificationChannel,
          requestNotificationPermission,
          startListening,
        } = await import('@features/notifications/services/notificationService');

        await setupNotificationChannel();
        const granted = await requestNotificationPermission();
        setPermission(granted);

        sub = await startListening((title, body) => {
          addNotification({ type: 'reminder', title, body });
        });
      } catch (_) {}
    })();

    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Redirect to onboarding after sign-out (when the app is already running)
  useEffect(() => {
    if (!showSplash && !isLoading && !isAuthenticated) {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isLoading, showSplash]);

  if (!fontsLoaded && !fontError) return null;

  const handleSplashDismiss = () => {
    setShowSplash(false);
    // Guard against the edge case where the Zustand store hasn't finished
    // rehydrating from AsyncStorage yet. If still loading, the useEffect
    // below will handle routing once isLoading settles to false.
    if (!isLoading && !isAuthenticated) {
      router.replace('/onboarding');
    }
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="accounts"      options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="categories"    options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="analytics"     options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ToastContainer />
      {showSplash && (
        <SplashOverlay isDark={themeMode === 'dark'} onDismiss={handleSplashDismiss} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
