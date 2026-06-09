import React, { memo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
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
  const activeIndex = FILTERS.findIndex((f) => f.value === activeType);

  const handlePress = useCallback(
    (value: TransactionType | 'all') => {
      Haptics.selectionAsync();
      onTypeChange(value);
    },
    [onTypeChange]
  );

  const trackBg  = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const activeBg = isDark ? colors.brand.primary      : colors.text.primary;
  const activeTx = isDark ? colors.text.inverse        : colors.white;

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {FILTERS.map((filter, idx) => {
        const isActive = idx === activeIndex;
        return (
          <Pressable
            key={filter.value}
            onPress={() => handlePress(filter.value)}
            style={[
              styles.tab,
              isActive && {
                backgroundColor: activeBg,
                borderRadius:    Radius.full,
              },
            ]}
            android_ripple={{ color: 'transparent' }}
          >
            <AppText
              variant="labelMD"
              numberOfLines={1}
              style={[
                styles.label,
                { color: isActive ? activeTx : colors.text.secondary },
              ]}
            >
              {filter.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  track: {
    flexDirection:     'row',
    alignItems:        'center',
    marginHorizontal:  Spacing['5'],
    marginBottom:      Spacing['3'],
    borderRadius:      Radius.full,
    padding:           3,
    height:            40,
  },
  tab: {
    flex:           1,
    height:         '100%',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   Radius.full,
    paddingHorizontal: Spacing['2'],
  },
  label: {
    fontSize:      13,
    fontWeight:    '600',
    letterSpacing: 0.1,
  },
});
