import React, { useEffect, memo } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';
import { useToastStore } from '@store/toastStore';
import { Radius, Spacing, Layout } from '@constants/index';
import type { ToastItem, ToastType } from '@store/toastStore';

// ─── Config per type ──────────────────────────────────────────────────────────

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TYPE_CONFIG: Record<ToastType, { icon: IoniconName; getColor: (colors: any) => string }> = {
  success: { icon: 'checkmark-circle',  getColor: (c) => c.status.income },
  error:   { icon: 'close-circle',      getColor: (c) => c.status.expense },
  warning: { icon: 'warning',           getColor: (c) => c.status.warning },
  info:    { icon: 'information-circle',getColor: (c) => c.status.savings },
};

// ─── Single toast chip ────────────────────────────────────────────────────────

interface ChipProps {
  item:      ToastItem;
  onDismiss: () => void;
}

const ToastChip = memo(function ToastChip({ item, onDismiss }: ChipProps) {
  const { colors } = useTheme();
  const { icon, getColor } = TYPE_CONFIG[item.type];
  const color = getColor(colors);

  const ty      = useSharedValue(90);
  const opacity = useSharedValue(0);
  const scale   = useSharedValue(0.88);

  useEffect(() => {
    // ── Entrance
    ty.value      = withSpring(0,   { damping: 22, stiffness: 220, mass: 0.85 });
    opacity.value = withTiming(1,   { duration: 220 });
    scale.value   = withSpring(1,   { damping: 18, stiffness: 240 });

    // ── Exit
    const exitAt = Math.max(item.duration - 320, 300);
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 260 });
      ty.value      = withTiming(80, { duration: 280 });
      scale.value   = withTiming(0.90, { duration: 260 }, () => {
        runOnJS(onDismiss)();
      });
    }, exitAt);

    return () => clearTimeout(timer);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  const bg     = colors.surface.sheet + 'F5';
  const border = colors.glass.background;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={onDismiss}
        style={[
          styles.chip,
          {
            backgroundColor: bg,
            borderColor:     border,
            shadowColor:     color,
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: color }]} />

        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: color + '1A' }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>

        {/* Message */}
        <AppText
          variant="labelMD"
          color={colors.text.primary}
          style={styles.message}
          numberOfLines={2}
        >
          {item.message}
        </AppText>

        {/* Action Button if provided */}
        {item.onAction && item.actionLabel && (
          <Pressable
            onPress={() => {
              item.onAction?.();
              onDismiss();
            }}
            style={({ pressed }) => [
              styles.actionBtn,
              { opacity: pressed ? 0.65 : 1 }
            ]}
          >
            <AppText variant="labelSM" style={{ color: color, fontWeight: '800' }}>
              {item.actionLabel.toUpperCase()}
            </AppText>
          </Pressable>
        )}

        {/* Dismiss × */}
        <Ionicons name="close" size={14} color={colors.text.tertiary} />
      </Pressable>
    </Animated.View>
  );
});

// ─── Container ────────────────────────────────────────────────────────────────

export function ToastContainer({ isModal = false }: { isModal?: boolean }) {
  const toasts = useToastStore((s) => s.toasts);
  const hide   = useToastStore((s) => s.hide);
  const insets = useSafeAreaInsets();

  if (!toasts.length) return null;

  const bottomOffset = isModal
    ? insets.bottom + Spacing['4']
    : Layout.tabBarHeight + insets.bottom + Spacing['3'];

  return (
    <View
      style={[styles.container, { bottom: bottomOffset }]}
      pointerEvents="box-none"
    >
      {toasts.map((item) => (
        <ToastChip
          key={item.id}
          item={item}
          onDismiss={() => hide(item.id)}
        />
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position:          'absolute',
    left:              Spacing['4'],
    right:             Spacing['4'],
    gap:               Spacing['2'],
    zIndex:            9999,
    pointerEvents:     'box-none',
  },
  chip: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    borderRadius:   Radius.xl,
    borderWidth:    1,
    overflow:       'hidden',
    paddingRight:   Spacing['4'],
    paddingVertical: Spacing['3'],
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius:  14,
      },
      android: { elevation: 10 },
    }),
  },
  accentBar: {
    width:  4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width:          34,
    height:         34,
    borderRadius:   17,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  message: {
    flex:       1,
    lineHeight: 20,
    fontWeight: '600',
  },
  actionBtn: {
    paddingHorizontal: Spacing['3'],
    paddingVertical: 6,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(0,0,0,0.03)',
    marginRight: 4,
  },
});
