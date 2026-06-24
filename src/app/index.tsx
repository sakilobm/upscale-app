import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { useAuthStore } from '@store/authStore';

/**
 * @file index.tsx
 * @description Root index screen acting as a traffic director.
 *              Redirects users immediately depending on their authentication state
 *              once hydration from AsyncStorage completes.
 */
export default function RootIndex() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  // Render a transparent view while store hydration is in progress
  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: 'transparent' }} />;
  }

  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}
