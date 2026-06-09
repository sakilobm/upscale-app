import React, { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { FilterBarProps } from '../types';
import type { TransactionType } from '@store/types';

const FILTERS: { label: string; value: TransactionType | 'all' }[] = [
  { label: 'All',       value: 'all'      },
  { label: 'Income',    value: 'income'   },
  { label: 'Expenses',  value: 'expense'  },
  { label: 'Transfers', value: 'transfer' },
];

export const FilterBar = memo(function FilterBar({
  activeType,
  onTypeChange,
}: FilterBarProps) {
  const { colors, isDark } = useTheme();

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
        const activeBg = isDark ? colors.brand.primary : colors.text.primary;
        const activeText = isDark ? colors.text.inverse : colors.white;

        return (
          <Pressable
            key={filter.value}
            onPress={() => handlePress(filter.value)}
            style={[
              styles.chip,
              {
                backgroundColor: isActive ? activeBg : colors.glass.background,
                borderColor: isActive ? activeBg : colors.glass.border,
              },
            ]}
          >
            <AppText
              variant="labelMD"
              color={isActive ? activeText : colors.text.secondary}
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
    overflow: 'hidden',
    minWidth: 72,
    alignItems: 'center',
  },
  label: { lineHeight: 20 },
});
