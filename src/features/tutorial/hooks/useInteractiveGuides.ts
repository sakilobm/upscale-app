/**
 * @file useInteractiveGuides.ts
 * @architecture Business Logic Layer — Feature Hook
 * @description Headless hook orchestrating guides sheet triggers, resets, and transitions.
 *   Manages navigation routing, stores resetting updates, and schedules haptic feedback sequences.
 * @associatedFiles src/components/profile/InteractiveGuidesSheet.tsx
 */

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTutorialStore, TourId } from '../store/tutorialStore';
import { useTheme } from '@hooks/useTheme';

export interface TourGuideItem {
  id: TourId;
  route: string;
}

export const TOURS: TourGuideItem[] = [
  { id: 'home', route: '/(tabs)' },
  { id: 'ledger', route: '/(tabs)/ledger' },
  { id: 'budget', route: '/(tabs)/budget' },
  { id: 'analytics', route: '/analytics' },
];

export interface UseInteractiveGuidesReturn {
  colors: any;
  isDark: boolean;
  completedTours: Record<TourId, boolean>;
  toursList: TourGuideItem[];
  handleLaunchTour: (tourId: TourId, route: string) => void;
  handleReset: () => Promise<void>;
}

/**
 * Headless Hook that isolates routing transitions, store coordination,
 * and haptic notifications for interactive walkthrough launches.
 */
export function useInteractiveGuides(onClose?: () => void): UseInteractiveGuidesReturn {
  const { colors, isDark } = useTheme();
  
  const completedTours = useTutorialStore((s) => s.completedTours);
  const startTour = useTutorialStore((s) => s.startTour);
  const resetAllTours = useTutorialStore((s) => s.resetAllTours);

  const handleLaunchTour = (tourId: TourId, route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose?.();
    
    // Delayed routing transition to allow sheets to slide down smoothly
    setTimeout(() => {
      router.push(route as any);
      setTimeout(() => {
        startTour(tourId);
      }, 300);
    }, 250);
  };

  const handleReset = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await resetAllTours();
  };

  return {
    colors,
    isDark,
    completedTours,
    toursList: TOURS,
    handleLaunchTour,
    handleReset,
  };
}
