export const Colors = {
  // Dark base palette
  background: {
    primary: '#070B14',
    secondary: '#0D1220',
    tertiary: '#121829',
    card: '#0F1523',
  },

  // Glass surfaces
  glass: {
    background: 'rgba(255, 255, 255, 0.05)',
    backgroundMid: 'rgba(255, 255, 255, 0.08)',
    backgroundStrong: 'rgba(255, 255, 255, 0.12)',
    border: 'rgba(255, 255, 255, 0.10)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    shine: 'rgba(255, 255, 255, 0.06)',
  },

  // Brand gradient stops
  brand: {
    primary: '#6C63FF',
    secondary: '#A78BFA',
    accent: '#38BDF8',
    accentWarm: '#FB923C',
  },

  // Semantic gradients
  gradients: {
    purpleBlue: ['#6C63FF', '#38BDF8'] as const,
    purpleViolet: ['#6C63FF', '#A78BFA'] as const,
    greenTeal: ['#10B981', '#06B6D4'] as const,
    orangeRed: ['#FB923C', '#EF4444'] as const,
    pinkPurple: ['#EC4899', '#8B5CF6'] as const,
    darkCard: ['#0D1220', '#121829'] as const,
    income: ['#10B981', '#34D399'] as const,
    expense: ['#EF4444', '#F87171'] as const,
    savings: ['#6C63FF', '#818CF8'] as const,
  },

  // Status colors
  status: {
    income: '#10B981',
    expense: '#EF4444',
    savings: '#6C63FF',
    neutral: '#94A3B8',
    warning: '#F59E0B',
    info: '#38BDF8',
  },

  // Text
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#475569',
    inverse: '#0A0E1A',
    brand: '#A78BFA',
    positive: '#34D399',
    negative: '#F87171',
  },

  // Neumorphic shadows (for light inset elements)
  shadow: {
    dark: 'rgba(0, 0, 0, 0.6)',
    darkMid: 'rgba(0, 0, 0, 0.4)',
    darkLight: 'rgba(0, 0, 0, 0.2)',
    highlight: 'rgba(255, 255, 255, 0.04)',
  },

  // Chart colors
  chart: {
    housing: '#6C63FF',
    food: '#FB923C',
    transport: '#38BDF8',
    health: '#10B981',
    entertainment: '#EC4899',
    shopping: '#F59E0B',
    other: '#94A3B8',
  },

  // Tab bar
  tabBar: {
    active: '#A78BFA',
    inactive: '#475569',
    background: 'rgba(7, 11, 20, 0.95)',
    indicator: '#6C63FF',
  },

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export type ColorKeys = keyof typeof Colors;
