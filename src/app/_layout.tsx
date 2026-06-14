import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, SplashScreen, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { useCachedFonts } from '@hooks/useCachedFonts';
import { useAuthStore } from '@store/authStore';
import { useThemeStore } from '@store/themeStore';
import { useNotificationStore } from '@store/notificationStore';
import { setupNotificationChannel, requestNotificationPermission } from '@features/notifications/services/notificationService';
import { SplashOverlay } from '@components/SplashOverlay';
import { ToastContainer } from '@components/Toast';
import { DarkTheme, LightTheme } from '@constants/themes';

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

  // Setup notification channel + permissions on first load
  useEffect(() => {
    (async () => {
      await setupNotificationChannel();
      const granted = await requestNotificationPermission();
      setPermission(granted);
    })();

    // Listen for notifications received while app is foregrounded
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      addNotification({
        type:  'reminder',
        title: notification.request.content.title ?? 'Reminder',
        body:  notification.request.content.body  ?? '',
      });
    });
    return () => sub.remove();
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
    if (!isAuthenticated) {
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
