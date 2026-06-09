import { Platform } from 'react-native';

export type AppTheme = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
  };
  glass: {
    background: string;
    backgroundMid: string;
    backgroundStrong: string;
    border: string;
    borderStrong: string;
    shine: string;
  };
  brand: {
    primary: string;
    secondary: string;
    accent: string;
    accentWarm: string;
  };
  gradients: {
    purpleBlue: readonly [string, string];
    purpleViolet: readonly [string, string];
    greenTeal: readonly [string, string];
    orangeRed: readonly [string, string];
    pinkPurple: readonly [string, string];
    darkCard: readonly [string, string];
    income: readonly [string, string];
    expense: readonly [string, string];
    savings: readonly [string, string];
    card: readonly [string, string];
  };
  status: {
    income: string;
    expense: string;
    savings: string;
    neutral: string;
    warning: string;
    info: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    brand: string;
    positive: string;
    negative: string;
  };
  shadow: {
    dark: string;
    darkMid: string;
    darkLight: string;
    highlight: string;
  };
  chart: {
    housing: string;
    food: string;
    transport: string;
    health: string;
    entertainment: string;
    shopping: string;
    other: string;
  };
  tabBar: {
    active: string;
    inactive: string;
    background: string;
    indicator: string;
  };
  white: string;
  black: string;
  transparent: string;
  isDark: boolean;
};

export const DarkTheme: AppTheme = {
  background: {
    primary: '#080C14',
    secondary: '#0D1220',
    tertiary: '#121829',
    card: '#0F1524',
  },
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundMid: 'rgba(255, 255, 255, 0.08)',
    backgroundStrong: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    shine: 'rgba(255, 255, 255, 0.06)',
  },
  brand: {
    primary: '#6C63FF',
    secondary: '#A78BFA',
    accent: '#38BDF8',
    accentWarm: '#FB923C',
  },
  gradients: {
    purpleBlue: ['#6C63FF', '#38BDF8'],
    purpleViolet: ['#6C63FF', '#A78BFA'],
    greenTeal: ['#10B981', '#06B6D4'],
    orangeRed: ['#FB923C', '#EF4444'],
    pinkPurple: ['#EC4899', '#8B5CF6'],
    darkCard: ['#0D1220', '#121829'],
    income: ['#10B981', '#34D399'],
    expense: ['#EF4444', '#F87171'],
    savings: ['#6C63FF', '#818CF8'],
    card: ['#1A1040', '#0D0820'],
  },
  status: {
    income: '#10B981',
    expense: '#EF4444',
    savings: '#6C63FF',
    neutral: '#94A3B8',
    warning: '#F59E0B',
    info: '#38BDF8',
  },
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#475569',
    inverse: '#0A0E1A',
    brand: '#A78BFA',
    positive: '#34D399',
    negative: '#F87171',
  },
  shadow: {
    dark: 'rgba(0, 0, 0, 0.6)',
    darkMid: 'rgba(0, 0, 0, 0.4)',
    darkLight: 'rgba(0, 0, 0, 0.2)',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },
  chart: {
    housing: '#6C63FF',
    food: '#FB923C',
    transport: '#38BDF8',
    health: '#10B981',
    entertainment: '#EC4899',
    shopping: '#F59E0B',
    other: '#94A3B8',
  },
  tabBar: {
    active: '#A78BFA',
    inactive: '#475569',
    background: Platform.select({ ios: 'rgba(8,12,20,0.85)', default: 'rgba(8,12,20,0.97)' }) as string,
    indicator: '#6C63FF',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  isDark: true,
};

export const LightTheme: AppTheme = {
  background: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    tertiary: '#ECEEF2',
    card: '#FFFFFF',
  },
  glass: {
    background: 'rgba(0, 0, 0, 0.028)',
    backgroundMid: 'rgba(0, 0, 0, 0.05)',
    backgroundStrong: 'rgba(0, 0, 0, 0.08)',
    border: 'rgba(0, 0, 0, 0.07)',
    borderStrong: 'rgba(0, 0, 0, 0.13)',
    shine: 'rgba(255, 255, 255, 0.9)',
  },
  brand: {
    primary: '#C4F135',
    secondary: '#0A0A0A',
    accent: '#6C63FF',
    accentWarm: '#FB923C',
  },
  gradients: {
    purpleBlue: ['#6C63FF', '#38BDF8'],
    purpleViolet: ['#6C63FF', '#A78BFA'],
    greenTeal: ['#10B981', '#06B6D4'],
    orangeRed: ['#FB923C', '#EF4444'],
    pinkPurple: ['#EC4899', '#8B5CF6'],
    darkCard: ['#ECEEF2', '#E2E5EB'],
    income: ['#10B981', '#34D399'],
    expense: ['#EF4444', '#F87171'],
    savings: ['#6C63FF', '#818CF8'],
    card: ['#C4F135', '#DAFF5A'],
  },
  status: {
    income: '#16A34A',
    expense: '#DC2626',
    savings: '#7C3AED',
    neutral: '#6B7280',
    warning: '#D97706',
    info: '#2563EB',
  },
  text: {
    primary: '#111827',
    secondary: '#6B7280',
    tertiary: '#9CA3AF',
    inverse: '#FFFFFF',
    brand: '#5B52E8',
    positive: '#16A34A',
    negative: '#DC2626',
  },
  shadow: {
    dark: 'rgba(0, 0, 0, 0.15)',
    darkMid: 'rgba(0, 0, 0, 0.08)',
    darkLight: 'rgba(0, 0, 0, 0.04)',
    highlight: 'rgba(255, 255, 255, 0.85)',
  },
  chart: {
    housing: '#6C63FF',
    food: '#FB923C',
    transport: '#3B82F6',
    health: '#10B981',
    entertainment: '#EC4899',
    shopping: '#F59E0B',
    other: '#9CA3AF',
  },
  tabBar: {
    active: '#111827',
    inactive: '#9CA3AF',
    background: Platform.select({ ios: 'rgba(255,255,255,0.85)', default: 'rgba(255,255,255,0.97)' }) as string,
    indicator: '#C4F135',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  isDark: false,
};
