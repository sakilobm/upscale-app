import React, { useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { useTheme } from '@hooks/useTheme';
import { Screen, Radius } from '@constants/Dimensions';
import { LinearGradient } from 'expo-linear-gradient';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}


const TAB_ITEMS: Record<
  string,
  { label: string; icon: IoniconName; iconFocused: IoniconName }
> = {
  index:        { label: 'Home',     icon: 'home-outline',        iconFocused: 'home'        },
  transactions: { label: 'Activity', icon: 'stats-chart-outline', iconFocused: 'stats-chart' },
  budget:       { label: 'Budget',   icon: 'wallet-outline',      iconFocused: 'wallet'      },
  ledger:       { label: 'Ledger',   icon: 'people-outline',      iconFocused: 'people'      },
  profile:      { label: 'Profile',  icon: 'person-outline',      iconFocused: 'person'      },
};

const CONTAINER_MARGIN = 20;
const CONTAINER_PADDING = 8;
const containerWidth = Screen.width - CONTAINER_MARGIN * 2;
const tabWidth = (containerWidth - CONTAINER_PADDING * 2) / 5;

function TabButton({
  label,
  icon,
  iconFocused,
  isFocused,
  onPress,
  onLongPress,
  activeColor,
  inactiveColor,
}: {
  label: string;
  icon: IoniconName;
  iconFocused: IoniconName;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  activeColor: string;
  inactiveColor: string;
}) {
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(isFocused ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: interpolate(progress.value, [0, 1], [1, 1.12]) },
        { translateY: interpolate(progress.value, [0, 1], [0, -8]) },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    return {
      opacity: progress.value,
      transform: [
        { translateY: interpolate(progress.value, [0, 1], [10, 0]) },
      ],
    };
  });

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={styles.tabButton}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.05)', borderless: true }}
    >
      <Animated.View style={iconStyle}>
        <Ionicons
          name={isFocused ? iconFocused : icon}
          size={22}
          color={isFocused ? activeColor : inactiveColor}
        />
      </Animated.View>
      <Animated.View style={[styles.textContainer, textStyle]}>
        <AppText
          variant="labelSM"
          style={[
            styles.tabLabel,
            { color: isFocused ? activeColor : inactiveColor },
          ]}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const activeIndex = useSharedValue(state.index);

  useEffect(() => {
    activeIndex.value = withSpring(state.index, {
      damping: 18,
      stiffness: 140,
      mass: 0.8,
    });
  }, [state.index, activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: CONTAINER_PADDING + activeIndex.value * tabWidth,
        },
      ],
    };
  });

  // Calculate bottom positioning based on device safe area inset
  const bottomPosition = Platform.select({
    ios: Math.max(insets.bottom, 12),
    android: 16,
    default: 16,
  });

  return (
    <View
      style={[
        styles.container,
        {
          bottom: bottomPosition,
          backgroundColor: isDark ? 'rgba(13, 18, 32, 0.70)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: colors.glass.border,
          shadowColor: colors.shadow.dark,
        },
      ]}
    >
      {Platform.OS === 'ios' && (
        <BlurView
          intensity={80}
          tint={isDark ? 'dark' : 'light'}
          style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
        />
      )}

      {/* Animated Sliding Background Highlight */}
      <Animated.View
        style={[
          styles.indicatorContainer,
          {
            width: tabWidth,
          },
          indicatorStyle,
        ]}
      >
        <LinearGradient
          colors={
            isDark
              ? ['rgba(108, 99, 255, 0.16)', 'rgba(56, 189, 248, 0.16)']
              : [colors.gradients.card[0], colors.gradients.card[1]]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.indicatorGradient,
            {
              borderColor: isDark ? 'rgba(108, 99, 255, 0.35)' : 'rgba(0, 0, 0, 0.05)',
              borderWidth: 1,
              shadowColor: isDark ? colors.brand.primary : colors.tabBar.indicator,
              shadowOpacity: isDark ? 0.2 : 0.4,
              shadowRadius: isDark ? 8 : 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: isDark ? 2 : 4,
            },
          ]}
        />
      </Animated.View>

      {/* Tab Buttons */}
      {state.routes.map((route: any, index: number) => {

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const tabConfig = TAB_ITEMS[route.name] || {
          label: route.name,
          icon: 'help-outline' as IoniconName,
          iconFocused: 'help' as IoniconName,
        };

        const onPress = () => {
          // Trigger selection haptic feedback
          Haptics.selectionAsync().catch(() => {});

          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        // Determine active text/icon color
        // If it's light theme, the indicator is lime/yellow card, so dark text is highly readable.
        // If it's dark theme, we use subtle purple/blue highlight so active color is colors.tabBar.active.
        const activeColor = isDark
          ? colors.tabBar.active
          : colors.black;

        return (
          <TabButton
            key={route.key}
            label={tabConfig.label}
            icon={tabConfig.icon}
            iconFocused={tabConfig.iconFocused}
            isFocused={isFocused}
            onPress={onPress}
            onLongPress={onLongPress}
            activeColor={activeColor}
            inactiveColor={colors.tabBar.inactive}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: CONTAINER_MARGIN,
    right: CONTAINER_MARGIN,
    height: 66,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: CONTAINER_PADDING,
    overflow: Platform.OS === 'ios' ? 'visible' : 'hidden', // Let shadow glow on iOS
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  indicatorContainer: {
    position: 'absolute',
    height: 48,
    top: 8, // (66 height - 48 indicatorHeight) / 2
    zIndex: 0,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 24, // height 48 / 2
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  textContainer: {
    position: 'absolute',
    bottom: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
