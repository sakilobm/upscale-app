import { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Spacing, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useCategoryStore, PRESET_COLORS, ICON_OPTIONS, type CategoryDef } from '@store/categoryStore';
import { toast } from '@store/toastStore';

const { width: SW } = Dimensions.get('window');

type ApplicableTo = 'expense' | 'income' | 'both';

const ICON_CELL = (SW - Spacing['5'] * 2 - Spacing['2'] * 9) / 10;
const GRID_COLS = 4;
const CARD_GAP = Spacing['3'];
const CARD_W = (SW - Spacing['5'] * 2 - CARD_GAP * (GRID_COLS - 1)) / GRID_COLS;

// ─── Category Form Modal ──────────────────────────────────────────────────────

function CategoryFormModal({
  visible,
  target,
  onClose,
}: {
  visible: boolean;
  target: CategoryDef | null;
  onClose: () => void;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const addCategory = useCategoryStore((s) => s.addCategory);
  const updateCategory = useCategoryStore((s) => s.updateCategory);

  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('cube');
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [applicableTo, setApplicableTo] = useState<ApplicableTo>('expense');

  const slideY = useSharedValue(600);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  useEffect(() => {
    if (visible) {
      setLabel(target?.label ?? '');
      setIcon(target?.icon ?? 'cube');
      setColor(target?.color ?? PRESET_COLORS[0]);
      setApplicableTo(target?.applicableTo ?? 'expense');
      slideY.value = withTiming(0, { duration: 380 });
    } else {
      slideY.value = withTiming(600, { duration: 260 });
    }
  }, [visible]);

  const handleSave = () => {
    if (!label.trim()) { toast.error('Enter a category name'); return; }
    if (target) {
      updateCategory(target.id, { label: label.trim(), icon, color, applicableTo });
      toast.success('Category updated');
    } else {
      addCategory({ label: label.trim(), icon, color, applicableTo });
      toast.success(`"${label.trim()}" created`);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const sheetBg = isDark ? '#0F1524' : '#FFFFFF';
  const inputBg = isDark ? '#1A2235' : '#F3F4F6';
  const isEdit = !!target;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          style={[
            styles.formSheet,
            { backgroundColor: sheetBg, paddingBottom: Math.max(insets.bottom, 24) },
            sheetStyle,
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

          {/* Header */}
          <View style={styles.formHeader}>
            <View>
              <AppText variant="headingSM" color={colors.text.primary}>
                {isEdit ? 'Edit Category' : 'New Category'}
              </AppText>
              <AppText variant="caption" color={colors.text.tertiary}>
                {isEdit ? 'Update icon, color & name' : 'Create a custom spending category'}
              </AppText>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
            {/* Live preview + name */}
            <View style={styles.previewRow}>
              <View style={[styles.iconPreview, { backgroundColor: color + '22', borderColor: color + '55' }]}>
                <Ionicons name={icon as any} size={30} color={color} />
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="Category name"
                  placeholderTextColor={colors.text.tertiary}
                  value={label}
                  onChangeText={setLabel}
                  maxLength={24}
                />
                <AppText variant="caption" color={colors.text.tertiary} style={{ paddingLeft: 2 }}>
                  Shown everywhere in the app
                </AppText>
              </View>
            </View>

            {/* Color */}
            <View>
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sectionLabel}>COLOR</AppText>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { setColor(c); Haptics.selectionAsync(); }}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      color === c && styles.colorDotActive,
                    ]}
                  >
                    {color === c && <Ionicons name="checkmark" size={13} color="#FFF" />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Applies to */}
            <View>
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sectionLabel}>APPLIES TO</AppText>
              <View style={styles.applyRow}>
                {(['expense', 'income', 'both'] as ApplicableTo[]).map((opt) => {
                  const active = applicableTo === opt;
                  const optColor = opt === 'expense' ? '#EF4444' : opt === 'income' ? '#10B981' : colors.brand.primary;
                  const optLabel = opt === 'both' ? 'Both' : opt.charAt(0).toUpperCase() + opt.slice(1);
                  const optIcon = opt === 'expense' ? 'trending-down' : opt === 'income' ? 'trending-up' : 'swap-horizontal';
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => { setApplicableTo(opt); Haptics.selectionAsync(); }}
                      style={[
                        styles.applyChip,
                        {
                          backgroundColor: active ? optColor + '18' : inputBg,
                          borderColor: active ? optColor + '50' : 'transparent',
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Ionicons name={optIcon as any} size={13} color={active ? optColor : colors.text.tertiary} />
                      <AppText
                        variant="labelSM"
                        style={{ color: active ? optColor : colors.text.secondary, fontWeight: active ? '700' : '500' }}
                      >
                        {optLabel}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Icon grid */}
            <View>
              <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sectionLabel}>ICON</AppText>
              <View style={styles.iconGrid}>
                {ICON_OPTIONS.map((ic) => {
                  const selected = icon === ic;
                  return (
                    <Pressable
                      key={ic}
                      onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
                      style={[
                        styles.iconCell,
                        {
                          width: ICON_CELL,
                          height: ICON_CELL,
                          backgroundColor: selected ? color + '22' : inputBg,
                          borderWidth: selected ? 2 : 0,
                          borderColor: color,
                        },
                      ]}
                    >
                      <Ionicons
                        name={ic as any}
                        size={Math.min(ICON_CELL * 0.48, 20)}
                        color={selected ? color : colors.text.secondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Save */}
            <Pressable
              onPress={handleSave}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={20} color="#FFF" />
              <AppText style={styles.saveBtnText}>
                {isEdit ? 'Save Changes' : 'Create Category'}
              </AppText>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

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

      <CategoryFormModal
        visible={formVisible}
        target={editTarget}
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

  // Modal backdrop
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },

  // Form sheet
  formSheet: {
    borderTopLeftRadius: Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    paddingHorizontal: Spacing['5'],
    paddingTop: Spacing['3'],
    maxHeight: '92%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.18, shadowRadius: 24 },
      android: { elevation: 28 },
    }),
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: Spacing['2'] },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing['4'] },
  closeBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  formScroll: { gap: Spacing['4'], paddingBottom: Spacing['2'] },

  // Form fields
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing['3'] },
  iconPreview: { width: 62, height: 62, borderRadius: 18, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  nameInput: { height: 50, borderRadius: Radius.lg, paddingHorizontal: Spacing['4'], fontSize: 15 },
  sectionLabel: { fontSize: 10, letterSpacing: 0.8, marginBottom: -Spacing['1'] },

  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['3'] },
  colorDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.12 }] },

  applyRow: { flexDirection: 'row', gap: Spacing['2'] },
  applyChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, height: 42, borderRadius: Radius.lg,
  },

  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['2'] },
  iconCell: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing['2'], height: 52, borderRadius: Radius.xl },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
