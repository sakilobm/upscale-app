/**
 * @file tutorialStore.ts
 * @architecture Business Logic Layer — State Management
 * @description Zustand store backed by AsyncStorage for tracking and triggering interactive app tours.
 *   Provides persistence for completed tours and active state management for step-by-step guides.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx, src/components/profile/InteractiveGuidesSheet.tsx
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TourId = 'home' | 'ledger' | 'budget' | 'analytics' | 'profile';

export type SpotlightArea = 'header-card' | 'quick-add' | 'stats-card' | 'list-row' | 'summary-card' | 'chart-area';

export interface TourStep {
  title:         string;
  description:   string;
  gestureHint?:  'swipe-left' | 'swipe-right' | 'tap';
  targetLabel:   string;
  spotlightArea: SpotlightArea;
}

export const TOUR_DEFINITIONS: Record<TourId, { name: string; icon: string; steps: TourStep[] }> = {
  home: {
    name: 'Home Screen Tour',
    icon: 'home-outline',
    steps: [
      {
        title: 'Net Worth Overview',
        description: 'See your total balance across all bank accounts and wallets in real-time.',
        targetLabel: 'NET WORTH',
        spotlightArea: 'header-card',
      },
      {
        title: 'Income & Expenses',
        description: 'Track your total incoming cash flow and monthly spending habits at a glance.',
        targetLabel: 'THIS MONTH STATS',
        spotlightArea: 'stats-card',
      },
      {
        title: 'Recent Activity',
        description: 'Swipe left on any transaction row to quickly edit or delete it.',
        gestureHint: 'swipe-left',
        targetLabel: 'RECENT ACTIVITY',
        spotlightArea: 'list-row',
      },
    ],
  },
  ledger: {
    name: 'Ledger & Debt Horizon',
    icon: 'book-outline',
    steps: [
      {
        title: 'Hand-to-Hand Loans',
        description: 'Track money you lent to friends or borrowed from family effortlessly.',
        targetLabel: 'LOAN SUMMARY',
        spotlightArea: 'summary-card',
      },
      {
        title: 'Settle & Manage',
        description: 'Swipe right on a contact card to record a partial or full payment settlement.',
        gestureHint: 'swipe-right',
        targetLabel: 'CONTACT CARD',
        spotlightArea: 'list-row',
      },
    ],
  },
  budget: {
    name: 'Budgets & Limits',
    icon: 'pie-chart-outline',
    steps: [
      {
        title: 'Category Spending Caps',
        description: 'Set monthly limits for Food, Shopping, Utilities, and receive smart warnings.',
        targetLabel: 'BUDGET CAPS',
        spotlightArea: 'summary-card',
      },
      {
        title: 'Planned Payments Timeline',
        description: 'Never miss bills or subscription dues with our proactive timeline alerts.',
        gestureHint: 'tap',
        targetLabel: 'PLANNED DUES',
        spotlightArea: 'list-row',
      },
    ],
  },
  analytics: {
    name: 'Analytics & Insights',
    icon: 'stats-chart-outline',
    steps: [
      {
        title: 'Financial Health Score',
        description: 'Monitor your savings rate, expense breakdown, and monthly cash flow trends.',
        targetLabel: 'FINANCIAL HEALTH',
        spotlightArea: 'chart-area',
      },
    ],
  },
  profile: {
    name: 'Account & Customization',
    icon: 'person-outline',
    steps: [
      {
        title: 'Security & Backup',
        description: 'Enable Face ID, export CSV reports, or sync your encrypted data anytime.',
        targetLabel: 'PREFERENCES',
        spotlightArea: 'summary-card',
      },
    ],
  },
};

interface TutorialState {
  completedTours: Record<TourId, boolean>;
  activeTourId:   TourId | null;
  currentStepIndex: number;
  
  // Actions
  loadCompletedTours: () => Promise<void>;
  startTour:         (tourId: TourId) => void;
  nextStep:          () => void;
  prevStep:          () => void;
  skipTour:          () => void;
  resetAllTours:     () => Promise<void>;
}

const STORAGE_KEY = 'wc_completed_tours_v1';

export const useTutorialStore = create<TutorialState>((set, get) => ({
  completedTours: {
    home: false,
    ledger: false,
    budget: false,
    analytics: false,
    profile: false,
  },
  activeTourId: null,
  currentStepIndex: 0,

  loadCompletedTours: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        set({ completedTours: JSON.parse(stored) });
      }
    } catch (e) {
      console.warn('Failed to load tutorial states', e);
    }
  },

  startTour: (tourId: TourId) => {
    set({ activeTourId: tourId, currentStepIndex: 0 });
  },

  nextStep: async () => {
    const { activeTourId, currentStepIndex, completedTours } = get();
    if (!activeTourId) return;

    const totalSteps = TOUR_DEFINITIONS[activeTourId].steps.length;
    if (currentStepIndex + 1 < totalSteps) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      // Tour finished!
      const updated = { ...completedTours, [activeTourId]: true };
      set({ activeTourId: null, currentStepIndex: 0, completedTours: updated });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save tutorial completion state', e);
      }
    }
  },

  prevStep: () => {
    const { currentStepIndex } = get();
    if (currentStepIndex > 0) {
      set({ currentStepIndex: currentStepIndex - 1 });
    }
  },

  skipTour: async () => {
    const { activeTourId, completedTours } = get();
    if (activeTourId) {
      const updated = { ...completedTours, [activeTourId]: true };
      set({ activeTourId: null, currentStepIndex: 0, completedTours: updated });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save tutorial skip state', e);
      }
    } else {
      set({ activeTourId: null, currentStepIndex: 0 });
    }
  },

  resetAllTours: async () => {
    const resetState = {
      home: false, ledger: false, budget: false, analytics: false, profile: false,
    };
    set({ completedTours: resetState, activeTourId: null, currentStepIndex: 0 });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to reset tutorials', e);
    }
  },
}));
