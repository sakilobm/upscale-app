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
  /** Small uppercase label above the title (e.g. "Monthly Overview") */
  screenLabel?: string;
  /** Chip content shown in the top-right corner (e.g. month/date label) */
  chipLabel?:   string;
  /** Icon name for the chip */
  chipIcon?:    React.ComponentProps<typeof Ionicons>['name'];
  /** Small caption below the chip */
  chipCaption?: string;
}

export function AppHeader({
  title,
  subtitle,
  rightNode,
  accentLine = true,
  badge,
  noPadding = false,
  screenLabel,
  chipLabel,
  chipIcon,
  chipCaption,
}: AppHeaderProps) {
  const { colors, isDark } = useTheme();

  const isBrightColor = !isDark && colors.brand.primary === '#C4F135';
  const chipTextColor = isBrightColor ? '#2E5403' : colors.brand.primary;

  const hasChip = !!chipLabel;
  const hasScreenLabel = !!screenLabel;

  return (
    <View style={[styles.wrapper, noPadding && styles.wrapperNoPadding]}>
      <View style={styles.row}>
        {/* Left: title + subtitle */}
        <View style={styles.titleBlock}>
          {hasScreenLabel && (
            <AppText style={[styles.screenLabel, { color: colors.text.tertiary }]}>
              {screenLabel}
            </AppText>
          )}
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
                    { color: colors.brand.onPrimary },
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

        {/* Right: chip or action slot */}
        {hasChip ? (
          <View style={styles.chipBlock}>
            <View style={[styles.chip, { backgroundColor: colors.brand.primary + '18', borderColor: colors.brand.primary + '30' }]}>
              {chipIcon && <Ionicons name={chipIcon} size={12} color={chipTextColor} />}
              <AppText style={{ color: chipTextColor, fontWeight: '700', fontSize: 11.5 }}>
                {chipLabel}
              </AppText>
            </View>
            {chipCaption && (
              <AppText style={[styles.chipCaption, { color: colors.text.tertiary }]}>
                {chipCaption}
              </AppText>
            )}
          </View>
        ) : rightNode ? (
          <View style={styles.rightSlot}>{rightNode}</View>
        ) : null}
      </View>

      {/* Gradient accent line */}
      {accentLine && (
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
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
    paddingBottom:     Spacing['3'],
    paddingHorizontal: Spacing['5'],
    gap:               Spacing['1'],
  },
  wrapperNoPadding: {
    paddingHorizontal: 0,
  },
  row: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    paddingBottom:  Spacing['1'],
  },
  titleBlock: {
    flex: 1,
    gap:  2,
  },
  screenLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 1,
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
  chipBlock: {
    alignItems: 'flex-end',
    gap: Spacing['1'],
    paddingTop: 3,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipCaption: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  accentLine: {
    height:           3,
    borderRadius:     Radius.full,
    marginBottom:     Spacing['1'],
    marginHorizontal: -Spacing['2'],
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
