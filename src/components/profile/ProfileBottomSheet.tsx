/**
 * @file ProfileBottomSheet.tsx
 * @architecture Presentation Layer — Reusable UI Component
 * @description Animated bottom-sheet modal used exclusively by the Profile screen.
 *   Handles backdrop + panel slide-up animation internally; callers just pass visible.
 * @associatedFiles src/app/(tabs)/profile.tsx, src/features/profile/hooks/useProfileScreen.ts
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

interface Props {
  visible:     boolean;
  onClose:     () => void;
  title:       string;
  children:    React.ReactNode;
  snapHeight?: number;
}

export function ProfileBottomSheet({ visible, onClose, title, children, snapHeight = 460 }: Props) {
  const { colors, isDark } = useTheme();
  const ty         = useSharedValue(snapHeight + 100);
  const dimOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      dimOpacity.value = withTiming(1, { duration: 220 });
      ty.value = withSpring(0, { damping: 26, stiffness: 220, mass: 0.9 });
    } else {
      dimOpacity.value = withTiming(0, { duration: 180 });
      ty.value = withTiming(snapHeight + 100, { duration: 240 });
    }
  }, [visible]);

  const sheetStyle    = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: dimOpacity.value }));

  const bg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <Animated.View style={[s.backdrop, backdropStyle]} pointerEvents={visible ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            s.panel,
            sheetStyle,
            {
              height:          snapHeight,
              backgroundColor: bg,
              borderColor:     isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        >
          <View style={[s.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)' }]} />
          <View style={s.titleRow}>
            <AppText variant="headingSM" color={colors.text.primary}>{title}</AppText>
            <Pressable onPress={onClose} hitSlop={12}>
              <View style={[s.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                <Ionicons name="close" size={15} color={colors.text.secondary} />
              </View>
            </Pressable>
          </View>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  panel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius:  Radius['2xl'],
    borderTopRightRadius: Radius['2xl'],
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    paddingTop: Spacing['3'],
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20 },
      android: { elevation: 20 },
    }),
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: Spacing['2'],
  },
  titleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing['5'], paddingBottom: Spacing['3'],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  closeBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
