/**
 * @file CategoryCard.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Grid card for a single category. Long-pressing a custom category
 *   reveals an action overlay (edit / delete / dismiss). Built-in categories show
 *   a lock badge and reject long-press with a toast.
 *   `showActions` is local display state — it has no business relevance.
 * @associatedFiles src/app/categories.tsx, src/features/categories/hooks/useCategoriesScreen.ts
 */

import { useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from '@components/AppText';
import { Radius, Spacing } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import type { CategoryDef } from '@store/categoryStore';

const { width: SW } = Dimensions.get('window');
const GRID_COLS = 4;
const CARD_GAP  = Spacing['3'];
export const CATEGORY_CARD_W = (SW - Spacing['5'] * 2 - CARD_GAP * (GRID_COLS - 1)) / GRID_COLS;

interface Props {
  cat:      CategoryDef;
  onEdit:   (c: CategoryDef) => void;
  onDelete: (c: CategoryDef) => void;
}

export function CategoryCard({ cat, onEdit, onDelete }: Props) {
  const { colors } = useTheme();
  const [showActions, setShowActions] = useState(false);

  const scale    = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleLongPress = () => {
    if (!cat.isCustom) { toast.info('Built-in categories cannot be deleted'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.94, { damping: 20, stiffness: 300 });
    setTimeout(() => { scale.value = withSpring(1); }, 180);
    setShowActions(true);
  };

  return (
    <View style={{ width: CATEGORY_CARD_W, alignItems: 'center', gap: 6 }}>
      <Animated.View style={[{ width: CATEGORY_CARD_W }, cardStyle]}>
        <Pressable
          onPress={() => { if (cat.isCustom && !showActions) onEdit(cat); }}
          onLongPress={handleLongPress}
          style={({ pressed }) => [
            s.card,
            {
              backgroundColor: cat.color + '16',
              borderColor:     cat.color + (showActions ? '60' : '30'),
              opacity:         pressed && !showActions ? 0.75 : 1,
            },
          ]}
        >
          <Ionicons name={cat.icon as any} size={28} color={cat.color} />

          <View style={[s.badge, { backgroundColor: cat.isCustom ? cat.color + '28' : colors.glass.backgroundMid }]}>
            <Ionicons name={cat.isCustom ? 'pencil' : 'lock-closed'} size={9} color={cat.isCustom ? cat.color : colors.text.tertiary} />
          </View>

          {showActions && (
            <View style={[s.overlay, { backgroundColor: colors.background.secondary + 'EE', borderRadius: Radius.xl }]}>
              <Pressable onPress={() => { setShowActions(false); onEdit(cat); }} style={[s.overlayBtn, { backgroundColor: cat.color + '22' }]}>
                <Ionicons name="pencil" size={15} color={cat.color} />
              </Pressable>
              <Pressable onPress={() => { setShowActions(false); onDelete(cat); }} style={[s.overlayBtn, { backgroundColor: colors.status.expense + '22' }]}>
                <Ionicons name="trash" size={15} color={colors.status.expense} />
              </Pressable>
              <Pressable onPress={() => setShowActions(false)} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
              </Pressable>
            </View>
          )}
        </Pressable>
      </Animated.View>

      <AppText variant="caption" color={colors.text.secondary} numberOfLines={1} style={{ fontSize: 11, fontWeight: '500', textAlign: 'center' }}>
        {cat.label}
      </AppText>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    height: CATEGORY_CARD_W, borderRadius: Radius.xl, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  badge: {
    position: 'absolute', top: 7, right: 7,
    width: 17, height: 17, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  overlayBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
