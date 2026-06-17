/**
 * @file useOnboardingScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Encapsulates all onboarding state: current slide step, user name input,
 *   currency selection, and the final "Get Started" action that creates the user record
 *   and navigates to the main app. The View layer receives a single typed contract.
 * @associatedFiles src/app/onboarding.tsx, src/store/authStore.ts
 */

import { useState } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@store/authStore';
import { toast } from '@store/toastStore';
import type { CurrencyCode } from '@store/types';
import { AVATAR_PRESETS } from '@constants/avatars';

export const ONBOARDING_TOTAL = 4; // 3 feature slides + 1 setup slide

export interface OnboardingSlideData {
  gradientKey: 'purpleViolet' | 'amberOrange' | 'greenTeal';
  icon:     string;
  badge:    string;
  title:    string;
  subtitle: string;
}

export const FEATURE_SLIDES: OnboardingSlideData[] = [
  {
    gradientKey: 'purpleViolet',
    icon:     'receipt-outline',
    badge:    'sparkles',
    title:    'Track Every Penny',
    subtitle: 'One tap to log income, expenses and transfers. See exactly where your money goes, in real time.',
  },
  {
    gradientKey: 'amberOrange',
    icon:     'bar-chart-outline',
    badge:    'trending-up',
    title:    'Budget With Purpose',
    subtitle: 'Set monthly limits per category. Visual progress rings alert you before you overspend.',
  },
  {
    gradientKey: 'greenTeal',
    icon:     'people-outline',
    badge:    'heart',
    title:    'Know What You Owe',
    subtitle: 'Built-in ledger tracks money lent or borrowed. Never lose sight of your financial relationships.',
  },
];

const CURRENCY_OPTIONS: { code: CurrencyCode; symbol: string; name: string }[] = [
  { code: 'USD', symbol: '$',  name: 'US Dollar'      },
  { code: 'EUR', symbol: '€',  name: 'Euro'           },
  { code: 'GBP', symbol: '£',  name: 'British Pound'  },
  { code: 'INR', symbol: '₹',  name: 'Indian Rupee'   },
  { code: 'JPY', symbol: '¥',  name: 'Japanese Yen'   },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar'},
  { code: 'AUD', symbol: 'A$', name: 'Aus Dollar'     },
];

export { CURRENCY_OPTIONS };

export function useOnboardingScreen() {
  const setUser = useAuthStore((s) => s.setUser);

  const [step,     setStep]     = useState(0);
  const [name,     setName]     = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [avatarId, setAvatarId] = useState(AVATAR_PRESETS[0].id);

  const isSetupStep = step === ONBOARDING_TOTAL - 1;
  const progress    = step / (ONBOARDING_TOTAL - 1);

  const handleNext = () => {
    Haptics.selectionAsync();
    setStep((s) => Math.min(s + 1, ONBOARDING_TOTAL - 1));
  };

  const handleBack = () => {
    Haptics.selectionAsync();
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSkip = () => {
    Haptics.selectionAsync();
    setStep(ONBOARDING_TOTAL - 1);
  };

  const handleGetStarted = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Please enter your name to continue');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUser({
      id:        `user-${Date.now()}`,
      email:     '',
      fullName:  trimmed,
      avatarUrl: avatarId,
      currency,
      createdAt: new Date().toISOString(),
    });
    router.replace('/(tabs)');
  };

  return {
    step,
    isSetupStep,
    progress,
    name,     setName,
    currency, setCurrency,
    avatarId, setAvatarId,
    handlers: {
      next:        handleNext,
      back:        handleBack,
      skip:        handleSkip,
      getStarted:  handleGetStarted,
    },
  };
}
