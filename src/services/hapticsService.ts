import * as Haptics from 'expo-haptics';
import { usePreferencesStore, type HapticLevel } from '@store/preferencesStore';

export type HapticTriggerType = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export async function triggerAppHaptic(
  type: HapticTriggerType,
  context: 'onboarding' | 'button' | 'action' = 'button'
) {
  const {
    hapticLevel,
    hapticsEnabledOnboarding,
    hapticsEnabledButtonTaps,
    hapticsEnabledActions,
  } = usePreferencesStore.getState();

  // 1. Global toggle
  if (hapticLevel === 'off') return;

  // 2. Context toggle
  if (context === 'onboarding' && !hapticsEnabledOnboarding) return;
  if (context === 'button' && !hapticsEnabledButtonTaps) return;
  if (context === 'action' && !hapticsEnabledActions) return;

  try {
    if (type === 'success') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === 'warning') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } else if (type === 'error') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } else if (type === 'selection') {
      await Haptics.selectionAsync().catch(() => {});
    } else {
      // Resolve level based on trigger type and user preferences
      let style = Haptics.ImpactFeedbackStyle.Medium;
      
      // Map user preferences
      if (hapticLevel === 'soft') {
        style = Haptics.ImpactFeedbackStyle.Soft;
      } else if (hapticLevel === 'light') {
        style = Haptics.ImpactFeedbackStyle.Light;
      } else if (hapticLevel === 'medium') {
        style = Haptics.ImpactFeedbackStyle.Medium;
      } else if (hapticLevel === 'heavy') {
        style = Haptics.ImpactFeedbackStyle.Heavy;
      }

      await Haptics.impactAsync(style).catch(() => {});
    }
  } catch (e) {
    // Fail silently
  }
}

function patchHapticMethod(name: string, patchedFn: any) {
  try {
    const desc = Object.getOwnPropertyDescriptor(Haptics, name);
    if (!desc || desc.configurable) {
      Object.defineProperty(Haptics, name, {
        value: patchedFn,
        configurable: true,
        writable: true,
      });
    } else {
      (Haptics as any)[name] = patchedFn;
    }
  } catch (e) {
    try {
      (Haptics as any)[name] = patchedFn;
    } catch (err) {
      console.warn(`[HapticsPatch] Failed to patch ${name}:`, err);
    }
  }
}

export function applyGlobalHapticPatch() {
  const originalSelection = Haptics.selectionAsync;
  const originalImpact = Haptics.impactAsync;
  const originalNotification = Haptics.notificationAsync;

  const patchedSelection = async () => {
    const { hapticLevel, hapticsEnabledOnboarding, hapticsEnabledButtonTaps } = usePreferencesStore.getState();
    if (hapticLevel === 'off') return;

    if ((globalThis as any).__isOnboardingActive) {
      if (!hapticsEnabledOnboarding) return;
    } else {
      if (!hapticsEnabledButtonTaps) return;
    }

    return originalSelection().catch(() => {});
  };

  const patchedImpact = async (style: Haptics.ImpactFeedbackStyle) => {
    const { hapticLevel, hapticsEnabledOnboarding, hapticsEnabledButtonTaps, hapticsEnabledActions } = usePreferencesStore.getState();
    if (hapticLevel === 'off') return;

    if ((globalThis as any).__isOnboardingActive) {
      if (!hapticsEnabledOnboarding) return;
    } else {
      if (style === Haptics.ImpactFeedbackStyle.Medium || style === Haptics.ImpactFeedbackStyle.Heavy) {
        if (!hapticsEnabledActions) return;
      } else {
        if (!hapticsEnabledButtonTaps) return;
      }
    }

    // Resolve user preferences override
    let finalStyle = style;
    if (hapticLevel === 'soft') {
      finalStyle = Haptics.ImpactFeedbackStyle.Soft;
    } else if (hapticLevel === 'light') {
      finalStyle = Haptics.ImpactFeedbackStyle.Light;
    } else if (hapticLevel === 'medium') {
      finalStyle = Haptics.ImpactFeedbackStyle.Medium;
    } else if (hapticLevel === 'heavy') {
      finalStyle = Haptics.ImpactFeedbackStyle.Heavy;
    }

    return originalImpact(finalStyle).catch(() => {});
  };

  const patchedNotification = async (type: Haptics.NotificationFeedbackType) => {
    const { hapticLevel, hapticsEnabledOnboarding, hapticsEnabledActions } = usePreferencesStore.getState();
    if (hapticLevel === 'off') return;

    if ((globalThis as any).__isOnboardingActive) {
      if (!hapticsEnabledOnboarding) return;
    } else {
      if (!hapticsEnabledActions) return;
    }

    return originalNotification(type).catch(() => {});
  };

  patchHapticMethod('selectionAsync', patchedSelection);
  patchHapticMethod('impactAsync', patchedImpact);
  patchHapticMethod('notificationAsync', patchedNotification);
}
