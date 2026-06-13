import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';
import { Radius, Spacing, Layout } from '@constants/index';

interface FABProps {
  icon:    React.ComponentProps<typeof Ionicons>['name'];
  label:   string;
  onPress: () => void;
  bottom?: number;
}

export function FAB({ icon, label, onPress, bottom }: FABProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 320 }, () => {
      scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    });
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { bottom: bottom ?? Layout.tabBarHeight + 16, shadowColor: colors.brand.primary },
        animStyle,
      ]}
    >
      <Pressable onPress={handlePress} style={styles.pressable}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.accent] as [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name={icon} size={20} color="#FFFFFF" />
        <AppText style={styles.label}>{label}</AppText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position:     'absolute',
    right:        Spacing['5'],
    borderRadius: Radius.full,
    overflow:     'hidden',
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.36, shadowRadius: 16 },
      android: { elevation: 10 },
    }),
  },
  pressable: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingVertical:   15,
    paddingHorizontal: 22,
  },
  label: {
    color:         '#FFFFFF',
    fontWeight:    '700',
    fontSize:      15,
    letterSpacing: 0.1,
  },
});
