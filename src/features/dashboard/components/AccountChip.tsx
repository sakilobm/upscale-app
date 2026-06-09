import React, { memo } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@components/AppText';
import { AmountText } from '@components/AmountText';
import { Colors, Radius, Spacing } from '@constants/index';
import type { AccountCardProps } from '../types';

export const AccountChip = memo(function AccountChip({
  account,
  isActive,
  onPress,
}: AccountCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        isActive && styles.activeContainer,
        { opacity: pressed ? 0.85 : 1 },
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
          color={isActive ? Colors.text.primary : Colors.text.secondary}
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
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.background,
    overflow: 'hidden',
    minWidth: 160,
  },
  activeContainer: {
    borderColor: Colors.glass.borderStrong,
  },
  icon: {
    fontSize: 22,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginLeft: 4,
  },
});
