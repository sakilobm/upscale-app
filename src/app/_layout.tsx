import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, SplashScreen, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { useNotificationStore } from '@store/notificationStore';
import { useSplashStore } from '@store/splashStore';
import { SplashOverlay } from '@components/SplashOverlay';
import { ToastContainer } from '@components/Toast';
import { TutorialSpotlightModal } from '@components/tutorial/TutorialSpotlightModal';
import { useTutorialStore } from '@features/tutorial/store/tutorialStore';
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
  const loadCompletedTours = useTutorialStore((s) => s.loadCompletedTours);

  const showSplash = useSplashStore((s) => s.showSplash);
  const dismissSplash = useSplashStore((s) => s.dismissSplash);

  useEffect(() => {
    loadCompletedTours();
    
    // Safety check: if the app previously crashed or was closed during an onboarding tutorial,
    // restore the user's original data state.
    import('@store/seedDemoData').then(({ hasDemoSnapshot, undoDemoData }) => {
      hasDemoSnapshot().then((hasSnapshot) => {
        if (hasSnapshot) {
          undoDemoData();
        }
      });
    });
  }, []);

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
    dismissSplash();
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: colors.background.primary }]}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="(tabs)"     options={{ animation: 'fade' }} />
        <Stack.Screen name="accounts"      options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="categories"    options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="analytics"     options={{ animation: 'slide_from_right' }} />
      </Stack>
      <ToastContainer />
      <TutorialSpotlightModal />
      {showSplash && (
        <SplashOverlay isDark={themeMode === 'dark'} onDismiss={handleSplashDismiss} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
