import React, { memo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useCategoryStore } from '@store/categoryStore';
import { useTransactionStore } from '@store/transactionStore';

export const CategoryFilterBar = memo(function CategoryFilterBar() {
  const { colors, isDark } = useTheme();
  const categories = useCategoryStore((s) => s.categories);
  const activeCategory = useTransactionStore((s) => s.filters.category);
  const setFilters = useTransactionStore((s) => s.setFilters);

  const handlePress = useCallback(
    (catId: string) => {
      Haptics.selectionAsync().catch(() => {});
      setFilters({ category: catId });
    },
    [setFilters]
  );

  return (
    <View style={s.outer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.content}>
        {/* All Categories Chip */}
        <Pressable
          onPress={() => handlePress('all')}
          style={({ pressed }) => [
            s.chip,
            {
              backgroundColor: activeCategory === 'all'
                ? colors.brand.primary
                : isDark ? colors.glass.background : colors.glass.backgroundMid,
              opacity: pressed ? 0.8 : 1,
            }
          ]}
        >
          <Ionicons
            name="grid-outline"
            size={13}
            color={activeCategory === 'all' ? colors.brand.onPrimary : colors.text.secondary}
          />
          <AppText
            variant="labelSM"
            style={{
              color: activeCategory === 'all' ? colors.brand.onPrimary : colors.text.secondary,
              fontWeight: '700',
            }}
          >
            All Categories
          </AppText>
        </Pressable>

        {/* Individual Category Chips */}
        {categories.map((cat) => {
          const active = activeCategory === cat.id;
          const chipColor = cat.color;
          return (
            <Pressable
              key={cat.id}
              onPress={() => handlePress(cat.id)}
              style={({ pressed }) => [
                s.chip,
                {
                  backgroundColor: active
                    ? chipColor + '1E'
                    : isDark ? colors.glass.background : colors.glass.backgroundMid,
                  borderColor: active ? chipColor + '60' : 'transparent',
                  borderWidth: 1,
                  opacity: pressed ? 0.8 : 1,
                }
              ]}
            >
              <Ionicons
                name={cat.icon as any}
                size={13}
                color={active ? chipColor : colors.text.secondary}
              />
              <AppText
                variant="labelSM"
                style={{
                  color: active ? chipColor : colors.text.secondary,
                  fontWeight: active ? '700' : '500',
                }}
              >
                {cat.label}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const s = StyleSheet.create({
  outer:   { paddingLeft: Spacing['5'], paddingVertical: Spacing['1'] },
  content: { paddingRight: Spacing['5'], alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
});
