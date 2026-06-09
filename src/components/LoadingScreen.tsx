import React, { memo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = memo(function LoadingScreen({
  message = 'Loading...',
}: LoadingScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
      <ActivityIndicator size="large" color={colors.brand.primary} />
      <AppText variant="bodySM" color={colors.text.secondary} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    marginTop: 8,
  },
});
