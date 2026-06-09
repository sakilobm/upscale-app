import { Platform } from 'react-native';

export const BlurConfigs = {
  // Glass card backgrounds
  card: {
    intensity: Platform.select({ ios: 40, android: 20, default: 40 }) as number,
    tint: 'dark' as const,
  },
  cardStrong: {
    intensity: Platform.select({ ios: 60, android: 30, default: 60 }) as number,
    tint: 'dark' as const,
  },
  // Modal / sheet overlays
  overlay: {
    intensity: Platform.select({ ios: 80, android: 50, default: 80 }) as number,
    tint: 'dark' as const,
  },
  // Tab bar
  tabBar: {
    intensity: Platform.select({ ios: 90, android: 60, default: 90 }) as number,
    tint: 'dark' as const,
  },
  // Header
  header: {
    intensity: Platform.select({ ios: 70, android: 40, default: 70 }) as number,
    tint: 'dark' as const,
  },
} as const;

export type BlurConfigKey = keyof typeof BlurConfigs;
