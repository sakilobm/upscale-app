import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  subtitle?: string;
}

export const EmptyState = memo(function EmptyState({
  emoji = '📭',
  title,
  subtitle,
}: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText variant="headingSM" color={colors.text.primary} align="center" style={styles.title}>
        {title}
      </AppText>
      {subtitle && (
        <AppText variant="bodySM" color={colors.text.secondary} align="center">
          {subtitle}
        </AppText>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['8'],
    gap: Spacing['3'],
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing['2'],
  },
  title: {},
});
