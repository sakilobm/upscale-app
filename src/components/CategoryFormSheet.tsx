import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
  Platform,
  Dimensions,
} from 'react-native';
import { KeyboardAvoidingSheet } from '@components/KeyboardAvoidingSheet';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { Spacing, Radius } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import {
  useCategoryStore,
  PRESET_COLORS,
  ICON_GROUPS,
  type CategoryDef,
} from '@store/categoryStore';
import { toast } from '@store/toastStore';

const { width: SW, height: SH } = Dimensions.get('window');

const ICON_COLS = 6;
const ICON_GAP  = Spacing['2'];
const ICON_CELL = Math.floor((SW - Spacing['5'] * 2 - ICON_GAP * (ICON_COLS - 1)) / ICON_COLS);

type ApplicableTo = 'expense' | 'income' | 'both';

export interface CategoryFormSheetProps {
  visible:      boolean;
  editTarget?:  CategoryDef | null;
  onClose:      () => void;
  onSaved?:     (id: string) => void;
}

export function CategoryFormSheet({
  visible,
  editTarget,
  onClose,
  onSaved,
}: CategoryFormSheetProps) {
  const { colors } = useTheme();
  const addCategory        = useCategoryStore((s) => s.addCategory);
  const updateCategory     = useCategoryStore((s) => s.updateCategory);

  const isEdit = !!editTarget;

  const [label,        setLabel]        = useState('');
  const [icon,         setIcon]         = useState('cube');
  const [color,        setColor]        = useState(PRESET_COLORS[0]);
  const [applicableTo, setApplicableTo] = useState<ApplicableTo>('expense');

  const slideY = useSharedValue(SH);
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: slideY.value }] }));

  useEffect(() => {
    if (visible) {
      setLabel(editTarget?.label        ?? '');
      setIcon(editTarget?.icon          ?? 'cube');
      setColor(editTarget?.color        ?? PRESET_COLORS[0]);
      setApplicableTo(editTarget?.applicableTo ?? 'expense');
      slideY.value = withTiming(0, { duration: 380, easing: Easing.out(Easing.cubic) });
    } else {
      slideY.value = withTiming(SH, { duration: 260, easing: Easing.in(Easing.cubic) });
    }
  }, [visible]);

  const handleSave = () => {
    if (!label.trim()) { toast.error('Enter a category name'); return; }
    if (isEdit) {
      updateCategory(editTarget!.id, { label: label.trim(), icon, color, applicableTo });
      toast.success('Category updated');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.(editTarget!.id);
    } else {
      addCategory({ label: label.trim(), icon, color, applicableTo });
      const newId = useCategoryStore.getState().categories.at(-1)?.id ?? 'other';
      toast.success(`"${label.trim()}" created`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.(newId);
    }
    onClose();
  };

  const sheetBg = colors.surface.sheet;
  const inputBg = colors.surface.input;
  const borderC = colors.glass.background;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={[styles.overlay, { backgroundColor: colors.overlay.heavy }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: sheetBg, shadowColor: colors.black }, sheetStyle]}>
          {/* Drag handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

          {/* ── Fixed header ─────────────────────────────────────────── */}
          <View style={[styles.headerRow, { borderBottomColor: borderC }]}>
            <View style={[styles.headerIcon, { backgroundColor: color + '20' }]}>
              <Ionicons name={icon as any} size={22} color={color} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="headingSM" color={colors.text.primary}>
                {isEdit ? 'Edit Category' : 'New Category'}
              </AppText>
              <AppText variant="caption" color={colors.text.tertiary}>
                {isEdit ? 'Update icon, color & label' : 'Design a custom spending category'}
              </AppText>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: colors.glass.backgroundMid }]}
            >
              <Ionicons name="close" size={18} color={colors.text.secondary} />
            </Pressable>
          </View>

          {/* ── Scrollable body + footer ─────────────────────────────── */}
          <KeyboardAvoidingSheet
            dividerColor={borderC}
            contentStyle={styles.scrollBody}
            footerStyle={{ paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], borderTopWidth: 1, borderTopColor: borderC }}
            footer={
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: color, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Ionicons name={isEdit ? 'checkmark-circle' : 'add-circle'} size={20} color={colors.white} />
                <AppText style={[styles.saveBtnText, { color: colors.white }]}>
                  {isEdit ? 'Save Changes' : 'Create Category'}
                </AppText>
              </Pressable>
            }
          >
            {/* Name + live preview */}
            <View style={styles.previewRow}>
              <View style={[styles.previewBox, { backgroundColor: color + '20', borderColor: color + '55' }]}>
                <Ionicons name={icon as any} size={34} color={color} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <TextInput
                  style={[styles.nameInput, { backgroundColor: inputBg, color: colors.text.primary }]}
                  placeholder="Category name…"
                  placeholderTextColor={colors.text.tertiary}
                  value={label}
                  onChangeText={setLabel}
                  maxLength={24}
                  autoCorrect={false}
                />
                <AppText variant="caption" color={colors.text.tertiary} style={{ paddingLeft: 4 }}>
                  Shown on transactions, budgets & charts
                </AppText>
              </View>
            </View>

            {/* ── Color ─────────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: color }]} />
                <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sLabel}>COLOR</AppText>
              </View>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((c) => (
                  <Pressable
                    key={c}
                    onPress={() => { setColor(c); Haptics.selectionAsync(); }}
                    style={[
                      styles.colorDot,
                      { backgroundColor: c },
                      color === c && [styles.colorDotActive, { borderColor: colors.white }],
                    ]}
                  >
                    {color === c && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── Applies to ─────────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionDot, { backgroundColor: colors.status.neutral }]} />
                <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sLabel}>APPLIES TO</AppText>
              </View>
              <View style={styles.applyRow}>
                {(['expense', 'income', 'both'] as ApplicableTo[]).map((opt) => {
                  const active    = applicableTo === opt;
                  const optColor  = opt === 'expense' ? colors.status.expense : opt === 'income' ? colors.status.income : colors.brand.primary;
                  const optLabel  = opt === 'both' ? 'Both' : opt.charAt(0).toUpperCase() + opt.slice(1);
                  const optIc     = opt === 'expense' ? 'trending-down' : opt === 'income' ? 'trending-up' : 'swap-horizontal';
                  return (
                    <Pressable
                      key={opt}
                      onPress={() => { setApplicableTo(opt); Haptics.selectionAsync(); }}
                      style={[
                        styles.applyChip,
                        {
                          backgroundColor: active ? optColor + '18' : inputBg,
                          borderColor:     active ? optColor + '55' : 'transparent',
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Ionicons name={optIc as any} size={14} color={active ? optColor : colors.text.tertiary} />
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

            {/* ── Icon groups ─────────────────────────────────────── */}
            {ICON_GROUPS.map((group) => (
              <View key={group.label} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={[styles.sectionDot, { backgroundColor: color }]} />
                  <AppText variant="labelSM" color={colors.text.tertiary} style={styles.sLabel}>
                    {group.label.toUpperCase()}
                  </AppText>
                </View>
                <View style={styles.iconRow}>
                  {group.icons.map((ic) => {
                    const selected = icon === ic;
                    return (
                      <Pressable
                        key={`${group.label}-${ic}`}
                        onPress={() => { setIcon(ic); Haptics.selectionAsync(); }}
                        style={[
                          styles.iconCell,
                          {
                            width:           ICON_CELL,
                            height:          ICON_CELL,
                            backgroundColor: selected ? color + '22' : inputBg,
                            borderWidth:     selected ? 2 : 0,
                            borderColor:     color,
                          },
                        ]}
                      >
                        <Ionicons
                          name={ic as any}
                          size={Math.min(ICON_CELL * 0.44, 20)}
                          color={selected ? color : colors.text.secondary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

          </KeyboardAvoidingSheet>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },

  sheet: {
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    maxHeight: SH * 0.92,
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.20, shadowRadius: 24 },
      android: { elevation: 32 },
    }),
  },

  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginVertical: Spacing['3'] },

  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing['3'],
    paddingHorizontal: Spacing['5'], paddingBottom: Spacing['4'],
    borderBottomWidth: 1,
  },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeBtn:   { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

  scrollBody: { paddingHorizontal: Spacing['5'], paddingTop: Spacing['4'], gap: Spacing['4'] },

  previewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing['3'] },
  previewBox: {
    width: 68, height: 68, borderRadius: 20,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  nameInput: {
    height: 50, borderRadius: Radius.lg,
    paddingHorizontal: Spacing['4'], fontSize: 15,
  },

  section: { gap: Spacing['2'] },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing['2'] },
  sectionDot:    { width: 6, height: 6, borderRadius: 3 },
  sLabel:        { fontSize: 11, letterSpacing: 0.7, fontWeight: '600' },

  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing['3'] },
  colorDot:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorDotActive: { borderWidth: 3, borderColor: 'transparent', transform: [{ scale: 1.1 }] },

  applyRow: { flexDirection: 'row', gap: Spacing['2'] },
  applyChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, height: 42, borderRadius: Radius.lg,
  },

  iconRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: ICON_GAP },
  iconCell: { borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },

  footer: {
    paddingHorizontal: Spacing['5'],
    paddingTop:        Spacing['4'],
    borderTopWidth:    1,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing['2'], height: 52, borderRadius: Radius.xl,
  },
  saveBtnText: { fontWeight: '700', fontSize: 15 },
});
