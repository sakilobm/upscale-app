import { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { CategoryFormSheet } from '@components/CategoryFormSheet';
import { Spacing, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useCategoryStore, type CategoryDef } from '@store/categoryStore';
import { toast } from '@store/toastStore';

const { width: SW } = Dimensions.get('window');

const GRID_COLS = 4;
const CARD_GAP  = Spacing['3'];
const CARD_W    = (SW - Spacing['5'] * 2 - CARD_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ─── Category Card ────────────────────────────────────────────────────────────

function CategoryCard({
  cat,
  onEdit,
  onDelete,
}: {
  cat: CategoryDef;
  onEdit: (c: CategoryDef) => void;
  onDelete: (c: CategoryDef) => void;
}) {
  const { colors, isDark } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleLongPress = () => {
    if (!cat.isCustom) { toast.info('Built-in categories cannot be deleted'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.94, { damping: 20, stiffness: 300 });
    setTimeout(() => { scale.value = withSpring(1); }, 180);
    setShowActions(true);
  };

  return (
    <View style={{ width: CARD_W, alignItems: 'center', gap: 6 }}>
      <Animated.View style={[{ width: CARD_W }, cardStyle]}>
        <Pressable
          onPress={() => { if (cat.isCustom && !showActions) onEdit(cat); }}
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            styles.catCard,
            {
              backgroundColor: cat.color + '16',
              borderColor: cat.color + (showActions ? '60' : '30'),
              opacity: pressed && !showActions ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name={cat.icon as any} size={28} color={cat.color} />

          {/* Lock / edit badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: cat.isCustom
                  ? cat.color + '28'
                  : isDark ? '#FFFFFF14' : '#00000010',
              },
            ]}
          >
            <Ionicons
              name={cat.isCustom ? 'pencil' : 'lock-closed'}
              size={9}
              color={cat.isCustom ? cat.color : colors.text.tertiary}
            />
          </View>

          {/* Action overlay on long-press (custom only) */}
          {showActions && (
            <View style={[styles.actionOverlay, { backgroundColor: isDark ? '#0F1524EE' : '#FFFFFFEE', borderRadius: Radius.xl }]}>
              <Pressable
                onPress={() => { setShowActions(false); onEdit(cat); }}
                style={[styles.overlayBtn, { backgroundColor: cat.color + '22' }]}
              >
                <Ionicons name="pencil" size={15} color={cat.color} />
              </Pressable>
              <Pressable
                onPress={() => { setShowActions(false); onDelete(cat); }}
                style={[styles.overlayBtn, { backgroundColor: '#EF444422' }]}
              >
                <Ionicons name="trash" size={15} color="#EF4444" />
              </Pressable>
              <Pressable onPress={() => setShowActions(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </Pressable>
            </View>
          )}
        </Pressable>
      </Animated.View>

      <AppText
        variant="caption"
        color={colors.text.secondary}
        numberOfLines={1}
        style={{ fontSize: 11, fontWeight: '500', textAlign: 'center' }}
      >
        {cat.label}
      </AppText>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function CategoriesScreen() {
  const { colors, isDark } = useTheme();
  const { categories, deleteCategory } = useCategoryStore();

  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<CategoryDef | null>(null);

  const builtIn = categories.filter((c) => !c.isCustom);
  const custom = categories.filter((c) => c.isCustom);

  const openCreate = () => { setEditTarget(null); setFormVisible(true); };
  const openEdit = (cat: CategoryDef) => { setEditTarget(cat); setFormVisible(true); };
  const handleDelete = (cat: CategoryDef) => {
    deleteCategory(cat.id);
    toast.info(`"${cat.label}" removed`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background.primary }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-down" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="headingSM" color={colors.text.primary}>Categories</AppText>
          <AppText variant="caption" color={colors.text.tertiary}>
            {builtIn.length} built-in · {custom.length} custom
          </AppText>
        </View>
        <Pressable
          onPress={openCreate}
          style={[styles.addBtn, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '45' }]}
        >
          <Ionicons name="add" size={22} color={colors.brand.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Built-in section */}
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(120)}>
          <View style={styles.sectionRow}>
            <AppText variant="labelMD" color={colors.text.secondary}>Built-in</AppText>
            <View style={[styles.countPill, { backgroundColor: isDark ? '#FFFFFF10' : '#00000008' }]}>
              <AppText variant="caption" color={colors.text.tertiary}>{builtIn.length}</AppText>
            </View>
          </View>
          <View style={styles.grid}>
            {builtIn.map((cat) => (
              <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={handleDelete} />
            ))}
          </View>
        </Animated.View>

        {/* Custom section */}
        <Animated.View entering={FadeInDown.springify().damping(18).stiffness(120).delay(80)}>
          <View style={styles.sectionRow}>
            <AppText variant="labelMD" color={colors.text.secondary}>My Categories</AppText>
            {custom.length > 0 && (
              <View style={[styles.countPill, { backgroundColor: colors.brand.primary + '18' }]}>
                <AppText variant="caption" style={{ color: colors.brand.primary }}>{custom.length}</AppText>
              </View>
            )}
          </View>

          {custom.length === 0 ? (
            <Pressable
              onPress={openCreate}
              style={[styles.emptyBox, { backgroundColor: isDark ? '#FFFFFF06' : '#F8F9FF', borderColor: colors.brand.primary + '35' }]}
            >
              <View style={[styles.emptyIcon, { backgroundColor: colors.brand.primary + '18' }]}>
                <Ionicons name="add" size={26} color={colors.brand.primary} />
              </View>
              <AppText variant="labelMD" color={colors.brand.primary}>Create your first category</AppText>
              <AppText variant="caption" color={colors.text.tertiary} style={{ textAlign: 'center', maxWidth: 220 }}>
                Add custom categories to better track your income and expenses
              </AppText>
            </Pressable>
          ) : (
            <View style={styles.grid}>
              {custom.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} onEdit={openEdit} onDelete={handleDelete} />
              ))}
              {/* Add more tile */}
              <Pressable
                onPress={openCreate}
                style={[
                  styles.catCard,
                  styles.addMoreCard,
                  { width: CARD_W, borderColor: colors.brand.primary + '40', backgroundColor: colors.brand.primary + '08' },
                ]}
              >
                <Ionicons name="add" size={26} color={colors.brand.primary} />
              </Pressable>
            </View>
          )}
        </Animated.View>

      </ScrollView>

      <CategoryFormSheet
        visible={formVisible}
        editTarget={editTarget}
        onClose={() => { setFormVisible(false); setEditTarget(null); }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing['5'], paddingVertical: Spacing['4'], gap: Spacing['3'],
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },

  // Scroll
  scroll: { paddingHorizontal: Spacing['5'], paddingBottom: 40, gap: Spacing['6'] },

  // Section
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'], marginBottom: Spacing['3'] },
  countPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },

  // Grid
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: CARD_GAP },

  // Card
  catCard: {
    height: CARD_W, borderRadius: Radius.xl, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  addMoreCard: { borderStyle: 'dashed' },
  badge: {
    position: 'absolute', top: 7, right: 7,
    width: 17, height: 17, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  actionOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  overlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  // Empty state
  emptyBox: {
    borderWidth: 1.5, borderStyle: 'dashed', borderRadius: Radius.xl,
    paddingVertical: Spacing['8'], alignItems: 'center', gap: Spacing['2'],
  },
  emptyIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing['2'],
  },

});
