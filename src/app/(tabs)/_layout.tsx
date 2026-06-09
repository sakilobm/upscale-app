import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { AppText } from '@components/AppText';
import { Colors, BlurConfigs, Layout } from '@constants/index';

const TAB_ITEMS = [
  { name: 'index',        label: 'Home',          emoji: '🏠' },
  { name: 'transactions', label: 'Transactions',  emoji: '💳' },
  { name: 'budget',       label: 'Budget',        emoji: '🎯' },
  { name: 'profile',      label: 'Profile',       emoji: '👤' },
] as const;

function TabBarBackground() {
  return (
    <BlurView
      intensity={BlurConfigs.tabBar.intensity}
      tint={BlurConfigs.tabBar.tint}
      style={StyleSheet.absoluteFill}
    />
  );
}

function TabBarIcon({
  emoji,
  label,
  focused,
}: {
  emoji: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <AppText style={styles.emoji}>{emoji}</AppText>
      <AppText
        variant="labelSM"
        color={focused ? Colors.tabBar.active : Colors.tabBar.inactive}
        style={styles.tabLabel}
      >
        {label}
      </AppText>
      {focused && <View style={styles.indicator} />}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          backgroundColor: Colors.tabBar.background,
          height: Layout.tabBarHeight,
          borderTopColor: Colors.glass.border,
          elevation: 0,
        },
        tabBarBackground: () => <TabBarBackground />,
      }}
    >
      {TAB_ITEMS.map(({ name, label, emoji }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabBarIcon emoji={emoji} label={label} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    gap: 3,
    minWidth: 60,
  },
  tabItemActive: {},
  emoji: {
    fontSize: 22,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.tabBar.indicator,
  },
});
