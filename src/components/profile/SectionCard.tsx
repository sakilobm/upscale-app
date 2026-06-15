import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring,
} from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { Spacing, Radius } from '@constants/index';

interface Props {
  title?:      string;
  children:    React.ReactNode;
  delay?:      number;
  accentColor?: string;
}

function useEntrance(delay: number) {
  const opacity = useSharedValue(0);
  const ty      = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 380 }));
    ty.value      = withDelay(delay, withSpring(0, { damping: 24, stiffness: 180 }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: ty.value }],
  }));
}

export function SectionCard({ title, children, delay = 0, accentColor }: Props) {
  const { colors, isDark } = useTheme();
  const anim  = useEntrance(delay);
  const dot   = accentColor ?? colors.brand.primary;
  const cardBg = isDark ? colors.background.secondary : '#FFFFFF';

  return (
    <Animated.View style={anim}>
      {title && (
        <View style={s.sectionHeader}>
          <View style={[s.sectionDot, { backgroundColor: dot }]} />
          <AppText
            variant="labelSM"
            style={[s.sectionLabel, { color: colors.text.secondary }]}
          >
            {title}
          </AppText>
        </View>
      )}
      <View
        style={[
          s.card,
          {
            backgroundColor: cardBg,
            borderColor:     isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          },
        ]}
      >
        {/* Subtle top accent stripe */}
        <View style={[s.topAccent, { backgroundColor: dot + '30' }]} />
        {children}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    marginBottom: Spacing['2'], marginLeft: 2, paddingHorizontal: 2,
  },
  sectionDot: {
    width: 4, height: 16, borderRadius: 2,
  },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', letterSpacing: 0.1,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth:  1,
    overflow:     'hidden',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 14 },
      android: { elevation: 3 },
    }),
  },
  topAccent: {
    height: 2,
  },
});
