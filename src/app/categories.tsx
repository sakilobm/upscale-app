/**
 * @file categories.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Categories management screen. Pure declarative orchestrator: reads a
 *   single contract from useCategoriesScreen and renders the CategoryCard grid.
 *   Zero business logic, zero raw useState, zero store imports.
 * @associatedFiles src/features/categories/hooks/useCategoriesScreen.ts,
 *   src/components/categories/CategoryCard.tsx
 */

import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCategoriesScreen } from '@features/categories/hooks/useCategoriesScreen';
import { CategoryCard, CATEGORY_CARD_W } from '@components/categories/CategoryCard';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

const CARD_GAP = Spacing['3'];

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const { builtIn, custom, formSheet, handlers } = useCategoriesScreen();

  return (
    <SafeAreaView style={[s.screen, { backgroundColor: colors.background.primary }]} edges={['top']}>
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.backBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSM" color={colors.text.primary}>Categories</AppText>
          <AppText variant="caption" color={colors.text.tertiary}>
            {builtIn.length} built-in · {custom.length} custom
          </AppText>
        </View>
        <Pressable
          onPress={formSheet.openCreate}
          style={[s.addBtn, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '45' }]}
        >
          <Ionicons name="add" size={22} color={colors.brand.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Built-in section */}
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(120)}>
          <View style={s.sectionRow}>
            <AppText variant="labelMD" color={colors.text.secondary}>Built-in</AppText>
            <View style={[s.countPill, { backgroundColor: colors.glass.background }]}>
              <AppText variant="caption" color={colors.text.tertiary}>{builtIn.length}</AppText>
            </View>
          </View>
          <View style={s.grid}>
            {builtIn.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} onEdit={handlers.openEdit} onDelete={handlers.handleDelete} />
            ))}
          </View>
        </Animated.View>

        {/* Custom section */}
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(120).delay(80)}>
          <View style={s.sectionRow}>
            <AppText variant="labelMD" color={colors.text.secondary}>My Categories</AppText>
            {custom.length > 0 && (
              <View style={[s.countPill, { backgroundColor: colors.brand.primary + '18' }]}>
                <AppText variant="caption" style={{ color: colors.brand.primary }}>{custom.length}</AppText>
              </View>
            )}
          </View>

          {custom.length === 0 ? (
            <Pressable
              onPress={formSheet.openCreate}
              style={[s.emptyBox, { backgroundColor: colors.glass.background, borderColor: colors.brand.primary + '35' }]}
            >
              <View style={[s.emptyIcon, { backgroundColor: colors.brand.primary + '18' }]}>
                <Ionicons name="add" size={26} color={colors.brand.primary} />
              </View>
              <AppText variant="labelMD" color={colors.brand.primary}>Create your first category</AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={{ textAlign: 'center', maxWidth: 220 }}>
                Add custom categories to better track your income and expenses
              </AppText>
            </Pressable>
          ) : (
            <View style={s.grid}>
              {custom.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onEdit={handlers.openEdit} onDelete={handlers.handleDelete} />
              ))}
              <Pressable
                onPress={formSheet.openCreate}
                style={[
                  s.addMoreCard,
                  { width: CATEGORY_CARD_W, height: CATEGORY_CARD_W, borderColor: colors.brand.primary + '40', backgroundColor: colors.brand.primary + '08' },
                ]}
              >
                <Ionicons name="add" size={26} color={colors.brand.primary} />
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <CategoryFormSheet
        visible={formSheet.isVisible}
        editTarget={formSheet.editTarget}
        onClose={formSheet.close}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn:  { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  scroll:     { paddingHorizontal: Spacing['5'], paddingBottom: 40, gap: Spacing['6'] },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], marginBottom: Spacing['3'] },
  countPill:  { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  addMoreCard: {
    borderRadius: Radius.xl, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },

  emptyBox: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.xl,
    paddingVertical: Spacing['8'], alignItems: 'center', gap: Spacing['2'],
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2'],
  },
});
