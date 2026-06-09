import React, { memo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@constants/index';
import { AppText } from './AppText';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen = memo(function LoadingScreen({
  message = 'Loading...',
}: LoadingScreenProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.brand.primary} />
      <AppText variant="bodySM" color={Colors.text.secondary} style={styles.text}>
        {message}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    marginTop: 8,
  },
});
