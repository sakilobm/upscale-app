import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { AccountCardProps } from '../types';

export const AccountChip = memo(function AccountChip({
  account,
  isActive,
  onPress,
}: AccountCardProps) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          borderColor: isActive ? colors.glass.borderStrong : colors.glass.border,
          backgroundColor: colors.background.card,
          shadowColor: colors.black,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {isActive && (
        <LinearGradient
          colors={[account.color + '30', account.color + '10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <AppText style={styles.icon}>{account.icon}</AppText>
      <View style={styles.text}>
        <AppText
          variant="labelSM"
          color={isActive ? colors.text.primary : colors.text.secondary}
          numberOfLines={1}
        >
          {account.name}
        </AppText>
        <AmountText
          amount={account.balance}
          currency={account.currency}
          type="balance"
          variant="labelMD"
        />
      </View>
      {isActive && (
        <View style={[styles.activeDot, { backgroundColor: account.color }]} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    paddingVertical: Spacing['3'],
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    minWidth: 160,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: { fontSize: 22 },
  text: { flex: 1, gap: 2 },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 4,
  },
});
