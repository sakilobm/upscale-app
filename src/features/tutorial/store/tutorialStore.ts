/**
 * @file tutorialStore.ts
 * @architecture Business Logic Layer — State Management
 * @description Zustand store backed by AsyncStorage for tracking and triggering interactive app tours.
 *   Provides persistence for completed tours and active state management for step-by-step guides.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx, src/components/profile/InteractiveGuidesSheet.tsx
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { seedDemoData, undoDemoData } from '@store/seedDemoData';
import { router } from 'expo-router';

export type TourId = 'home' | 'ledger' | 'budget' | 'analytics' | 'profile';

export type SpotlightArea = 'header-card' | 'quick-add' | 'stats-card' | 'list-row' | 'summary-card' | 'chart-area' | 'manage-btn' | 'analytics-cta';

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
        title: 'Manage Accounts',
        description: 'Tap Manage to create, edit, or customize your banking cards and wallets.',
        targetLabel: 'MANAGE CARD',
        spotlightArea: 'manage-btn',
      },
      {
        title: 'Income & Expenses',
        description: 'Track your total incoming cash flow and monthly spending habits at a glance.',
        targetLabel: 'THIS MONTH STATS',
        spotlightArea: 'stats-card',
      },
      {
        title: 'Financial Analytics',
        description: 'Dive deep into interactive category spending charts and savings progress graphs.',
        targetLabel: 'FULL ANALYTICS',
        spotlightArea: 'analytics-cta',
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
      {
        title: 'Add New Record',
        description: 'Tap the Add Entry button to record a new loan, cash debt, or friend split instantly.',
        targetLabel: 'ADD ENTRY',
        spotlightArea: 'quick-add',
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
  isLaunching:    boolean;
  
  // Actions
  loadCompletedTours: () => Promise<void>;
  startTour:         (tourId: TourId) => Promise<void>;
  nextStep:          () => Promise<void>;
  prevStep:          () => void;
  skipTour:          () => Promise<void>;
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
  isLaunching: false,

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

  startTour: async (tourId: TourId) => {
    // 1. Enter launching state to trigger the global transitions overlay
    set({ isLaunching: true, activeTourId: null, currentStepIndex: 0 });
    
    // 2. Allow navigation routing animations (e.g. router.push) to complete smoothly
    await new Promise((resolve) => setTimeout(resolve, 600));

    // 3. Seed demo data asynchronously
    await seedDemoData();

    // 4. End launching state and activate the tour spotlight modal
    set({ isLaunching: false, activeTourId: tourId, currentStepIndex: 0 });
  },

  nextStep: async () => {
    const { activeTourId, currentStepIndex, completedTours } = get();
    if (!activeTourId) return;

    const totalSteps = TOUR_DEFINITIONS[activeTourId].steps.length;
    if (currentStepIndex + 1 < totalSteps) {
      set({ currentStepIndex: currentStepIndex + 1 });
    } else {
      // Tour finished! Restore the user's original data state
      await undoDemoData();
      const updated = { ...completedTours, [activeTourId]: true };
      set({ activeTourId: null, currentStepIndex: 0, completedTours: updated });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save tutorial completion state', e);
      }

      // Auto-redirect back to Profile screen and reopen the guides sheet
      router.push('/(tabs)/profile?openGuides=true');
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
    // Restore the user's original data state on skip
    await undoDemoData();
    if (activeTourId) {
      const updated = { ...completedTours, [activeTourId]: true };
      set({ activeTourId: null, currentStepIndex: 0, completedTours: updated });
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save tutorial skip state', e);
      }

      // Auto-redirect back to Profile screen and reopen the guides sheet
      router.push('/(tabs)/profile?openGuides=true');
    } else {
      set({ activeTourId: null, currentStepIndex: 0 });
    }
  },

  resetAllTours: async () => {
    // Safety undo if active
    await undoDemoData();
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
