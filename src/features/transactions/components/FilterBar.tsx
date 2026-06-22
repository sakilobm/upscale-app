import React, { memo, useCallback, type ComponentProps } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import type { FilterBarProps } from '../types';
import type { TransactionType } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const FILTERS: { label: string; value: TransactionType | 'all'; icon: IoniconName }[] = [
  { label: 'All',       value: 'all',      icon: 'grid-outline'               },
  { label: 'Income',    value: 'income',    icon: 'arrow-down-circle-outline'  },
  { label: 'Expense',   value: 'expense',   icon: 'arrow-up-circle-outline'    },
  { label: 'Transfer',  value: 'transfer',  icon: 'swap-horizontal-outline'    },
];

/** Single filter chip with micro-scale animation on press */
function FilterChip({
  filter,
  isActive,
  onPress,
}: {
  filter: (typeof FILTERS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 350 }, () => {
      scale.value = withSpring(1, { damping: 15, stiffness: 350 });
    });
    onPress();
  };

  const activeBg    = colors.brand.primary;
  const activeTx    = colors.brand.onPrimary;
  const inactiveBg  = isDark ? colors.glass.background : colors.glass.backgroundMid;
  const inactiveTx  = colors.text.secondary;
  const inactiveIcon = colors.text.tertiary;

  return (
    <Pressable onPress={handlePress} style={styles.chipPressable}>
      <Animated.View
        style={[
          styles.chip,
          animStyle,
          {
            backgroundColor: isActive ? activeBg : inactiveBg,
          },
          isActive && styles.chipActive,
          isActive && { shadowColor: isDark ? activeBg : '#000' },
        ]}
      >
        <Ionicons
          name={filter.icon}
          size={14}
          color={isActive ? activeTx : inactiveIcon}
        />
        <AppText
          numberOfLines={1}
          style={[
            styles.chipLabel,
            {
              color: isActive ? activeTx : inactiveTx,
              fontWeight: isActive ? '700' : '500',
            },
          ]}
        >
          {filter.label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

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
    <Animated.View
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      {FILTERS.map((filter) => (
        <FilterChip
          key={filter.value}
          filter={filter}
          isActive={filter.value === activeType}
          onPress={() => handlePress(filter.value)}
        />
      ))}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: Spacing['5'],
  },
  chipPressable: {},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
  },
  chipActive: {
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
      android: { elevation: 3 },
    }),
  },
  chipLabel: {
    fontSize: 12.5,
    letterSpacing: 0.1,
  },
});
