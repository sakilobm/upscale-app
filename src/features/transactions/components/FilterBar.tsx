import React, { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Colors, Radius, Spacing } from '@constants/index';
import type { FilterBarProps } from '../types';
import type { TransactionType } from '@store/types';

const FILTERS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Income', value: 'income' },
  { label: 'Expenses', value: 'expense' },
  { label: 'Transfers', value: 'transfer' },
];

export const FilterBar = memo(function FilterBar({
  activeType,
  onTypeChange,
}: FilterBarProps) {
  const handlePress = useCallback(
    (value: TransactionType | 'all') => {
      Haptics.selectionAsync();
      onTypeChange(value);
    },
    [onTypeChange]
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isActive = filter.value === activeType;
        return (
          <Pressable
            key={filter.value}
            onPress={() => handlePress(filter.value)}
            style={styles.chip}
          >
            {isActive && (
              <LinearGradient
                colors={Colors.gradients.purpleBlue as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[StyleSheet.absoluteFill, { borderRadius: Radius.full }]}
              />
            )}
            <AppText
              variant="labelMD"
              color={isActive ? Colors.white : Colors.text.secondary}
              style={styles.label}
            >
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing['5'],
    gap: Spacing['2'],
    paddingVertical: Spacing['1'],
  },
  chip: {
    paddingHorizontal: Spacing['5'],
    paddingVertical: Spacing['2'],
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.glass.border,
    backgroundColor: Colors.glass.background,
    overflow: 'hidden',
    minWidth: 72,
    alignItems: 'center',
  },
  label: {
    lineHeight: 20,
  },
});
