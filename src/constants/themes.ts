import { Platform } from 'react-native';

export type AppTheme = {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    card: string;
  };
  surface: {
    input: string;   // TextInput / interactive field background
    sheet: string;   // Modal / bottom-sheet card surface
  };
  overlay: {
    medium: string;  // Standard modal backdrop (~45% opacity)
    heavy:  string;  // Dense overlay backdrop (~60% opacity)
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
    onPrimary: string;  // Contrasting text/icon color on top of brand.primary
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
    amberOrange: readonly [string, string];
    indigoViolet: readonly [string, string];
    amberYellow: readonly [string, string];
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
  balanceCard: {
    gradient: readonly [string, string, string];
    glowTopRight: string;
    glowBottomLeft: string;
    containerBorder: string;
    innerBorder: string;
    titleColor: string;
    balanceColor: string;
    labelColor: string;
    valueColor: string;
  };
  profileCard: {
    gradient: readonly [string, string];
    blobTL: string;
    blobBR: string;
    borderColor: string;
    nameColor: string;
    emailColor: string;
    badgeText: string;
    badgeBg: string;
    badgeBorder: string;
    proBg: string;
    proBorder: string;
    proText: string;
  };
  isDark: boolean;
};

export const DarkTheme: AppTheme = {
  background: {
    primary: '#080C14',
    secondary: '#0D1220',
    tertiary: '#121829',
    card: '#0F1524',
  },
  surface: {
    input: '#1A2235',
    sheet: '#0D1220',
  },
  overlay: {
    medium: 'rgba(0,0,0,0.45)',
    heavy:  'rgba(0,0,0,0.60)',
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
    onPrimary: '#FFFFFF',
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
    amberOrange: ['#F59E0B', '#FB923C'],
    indigoViolet: ['#6366F1', '#8B5CF6'],
    amberYellow: ['#F59E0B', '#FBBF24'],
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
  balanceCard: {
    gradient: ['#18103A', '#0A051C', '#040712'],
    glowTopRight: 'rgba(108, 99, 255, 0.30)',
    glowBottomLeft: 'rgba(56, 189, 248, 0.22)',
    containerBorder: 'rgba(255, 255, 255, 0.1)',
    innerBorder: 'rgba(255, 255, 255, 0.18)',
    titleColor: '#FFFFFF',
    balanceColor: '#FFFFFF',
    labelColor: 'rgba(255, 255, 255, 0.65)',
    valueColor: 'rgba(255, 255, 255, 0.85)',
  },
  profileCard: {
    gradient: ['#1A1040', '#0D0826'],
    blobTL: 'rgba(108, 99, 255, 0.42)',
    blobBR: 'rgba(56, 189, 248, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    nameColor: '#FFFFFF',
    emailColor: 'rgba(255, 255, 255, 0.78)',
    badgeText: 'rgba(255, 255, 255, 0.88)',
    badgeBg: 'rgba(255, 255, 255, 0.06)',
    badgeBorder: 'rgba(255, 255, 255, 0.12)',
    proBg: 'rgba(108, 99, 255, 0.14)',
    proBorder: 'rgba(108, 99, 255, 0.25)',
    proText: '#E9D5FF',
  },
  isDark: true,
};

export const LightTheme: AppTheme = {
  background: {
    primary: '#F5F7FA',
    secondary: '#FFFFFF',
    tertiary: '#ECEEF2',
    card: '#FFFFFF',
  },
  surface: {
    input: '#F3F4F6',
    sheet: '#FFFFFF',
  },
  overlay: {
    medium: 'rgba(0,0,0,0.35)',
    heavy:  'rgba(0,0,0,0.55)',
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
    onPrimary: '#000000',
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
    amberOrange: ['#F59E0B', '#FB923C'],
    indigoViolet: ['#6366F1', '#8B5CF6'],
    amberYellow: ['#F59E0B', '#FBBF24'],
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
  balanceCard: {
    gradient: ['#C4F135', '#5ED66B', '#10B981'],
    glowTopRight: 'rgba(255, 255, 255, 0.58)',
    glowBottomLeft: 'rgba(56, 189, 248, 0.40)',
    containerBorder: 'rgba(255, 255, 255, 0.45)',
    innerBorder: 'rgba(255, 255, 255, 0.55)',
    titleColor: '#000000',
    balanceColor: '#000000',
    labelColor: 'rgba(0, 0, 0, 0.68)',
    valueColor: 'rgba(0, 0, 0, 0.85)',
  },
  profileCard: {
    gradient: ['#C4F135', '#A8E000'],
    blobTL: 'rgba(255, 255, 255, 0.55)',
    blobBR: 'rgba(0, 0, 0, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
    nameColor: '#000000',
    emailColor: 'rgba(0, 0, 0, 0.70)',
    badgeText: 'rgba(0, 0, 0, 0.75)',
    badgeBg: 'rgba(0, 0, 0, 0.05)',
    badgeBorder: 'rgba(0, 0, 0, 0.10)',
    proBg: 'rgba(0, 0, 0, 0.05)',
    proBorder: 'rgba(0, 0, 0, 0.10)',
    proText: '#000000',
  },
  isDark: false,
};
