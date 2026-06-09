import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/Dimensions';

interface AppHeaderProps {
  title:        string;
  subtitle?:    string;
  rightNode?:   React.ReactNode;
  /** Show a gradient accent line at the bottom */
  accentLine?:  boolean;
  /** Show a pill-badge count next to title */
  badge?:       number;
  /** Set true when AppHeader is already inside a horizontally-padded container */
  noPadding?:   boolean;
}

export function AppHeader({
  title,
  subtitle,
  rightNode,
  accentLine = true,
  badge,
  noPadding = false,
}: AppHeaderProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.wrapper, noPadding && styles.wrapperNoPadding]}>
      <View style={styles.row}>
        {/* Left: title + subtitle */}
        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            <AppText
              variant="headingLG"
              color={colors.text.primary}
              style={styles.title}
            >
              {title}
            </AppText>
            {badge !== undefined && badge > 0 && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: colors.brand.primary + (isDark ? 'CC' : 'FF') },
                ]}
              >
                <AppText
                  variant="labelSM"
                  style={[
                    styles.badgeText,
                    { color: isDark ? colors.text.inverse : '#000' },
                  ]}
                >
                  {badge > 99 ? '99+' : badge}
                </AppText>
              </View>
            )}
          </View>
          {subtitle && (
            <AppText
              variant="caption"
              color={colors.text.tertiary}
              style={styles.subtitle}
            >
              {subtitle}
            </AppText>
          )}
        </View>

        {/* Right: action slot */}
        {rightNode && <View style={styles.rightSlot}>{rightNode}</View>}
      </View>

      {/* Gradient accent line */}
      {accentLine && (
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.primary + '00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.accentLine}
        />
      )}
    </View>
  );
}

// ─── Convenience: icon action button ─────────────────────────────────────────

interface HeaderIconBtnProps {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}

export function HeaderIconBtn({ icon, onPress }: HeaderIconBtnProps) {
  const { colors, isDark } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={({ pressed }) => [
        styles.iconBtn,
        {
          backgroundColor: isDark
            ? colors.glass.backgroundMid
            : 'rgba(0,0,0,0.04)',
          borderColor: isDark
            ? colors.glass.border
            : 'rgba(0,0,0,0.07)',
          opacity: pressed ? 0.65 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop:        Spacing['4'],
    paddingBottom:     Spacing['1'],
    paddingHorizontal: Spacing['5'],
    gap:               Spacing['2'],
  },
  wrapperNoPadding: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingBottom:  Spacing['2'],
  },
  titleBlock: {
    flex: 1,
    gap:  2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  title: {
    lineHeight: 34,
  },
  subtitle: {
    letterSpacing: 0.2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical:   3,
    borderRadius:      Radius.full,
    alignSelf:         'center',
  },
  badgeText: {
    fontSize:   10,
    fontWeight: '800',
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing['2'],
  },
  accentLine: {
    height:       3,
    borderRadius: Radius.full,
    marginBottom: Spacing['2'],
  },
  iconBtn: {
    width:          38,
    height:         38,
    borderRadius:   Radius.lg,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
});
