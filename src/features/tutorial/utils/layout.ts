/**
 * @file layout.ts
 * @architecture Business/Layout Logic Layer — Utilities
 * @description Computes spotlight configurations and floating card offsets.
 *   Calculates precise positioning styles and margins for targeted tutorial walkthrough areas.
 * @associatedFiles src/components/tutorial/TutorialSpotlightModal.tsx
 */

import { SpotlightArea, TourId } from '../store/tutorialStore';
import { Radius } from '@constants/index';

export interface SpotlightStyle {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  width: number;
  height: number;
  borderRadius: number;
}

export interface LayoutConfig {
  spotlightStyle: SpotlightStyle;
  cardTopPosition: number;
  badgeStyle?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
    width?: number;
    justifyContent?: 'center' | 'flex-start' | 'flex-end';
  };
}

/**
 * Computes layout positioning configuration dynamically for spotlight area and active tour.
 * Separates coordinate maths from visual component presentation.
 * 
 * @param area The target UI element spotlight region
 * @param tourId The active screen onboarding tour ID
 * @param insetsTop The top safe-area padding inset of the screen
 * @param screenWidth The total viewport width of the device
 * @returns Precise style dimensions for the spotlight frame and card top offset
 */
export const getSpotlightLayoutConfig = (
  area: SpotlightArea,
  tourId: TourId,
  insetsTop: number,
  screenWidth: number
): LayoutConfig => {
  // 1. Home screen specific coordinates
  if (tourId === 'home') {
    switch (area) {
      case 'header-card':
        return {
          spotlightStyle: {
            top: insetsTop + 70,
            left: 16,
            width: screenWidth - 32,
            height: 215,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insetsTop + 305,
        };
      case 'manage-btn':
        return {
          spotlightStyle: {
            top: insetsTop + 73,
            left: screenWidth - 81,
            width: 68,
            height: 28,
            borderRadius: Radius.md,
          },
          cardTopPosition: insetsTop + 120,
          badgeStyle: {
            top: -28,
            left: -36,
            width: 100,
            justifyContent: 'center',
          },
        };
      case 'stats-card':
        return {
          spotlightStyle: {
            top: insetsTop + 310,
            left: 16,
            width: screenWidth - 32,
            height: 90,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 415,
        };
      case 'analytics-cta':
        return {
          spotlightStyle: {
            top: insetsTop + 580,
            left: 16,
            width: screenWidth - 32,
            height: 76,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 140,
        };
      case 'list-row':
      default:
        return {
          spotlightStyle: {
            top: insetsTop + 670,
            left: 16,
            width: screenWidth - 32,
            height: 75,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 280,
        };
    }
  }

  // 2. Ledger screen specific coordinates
  if (tourId === 'ledger') {
    switch (area) {
      case 'summary-card':
        return {
          spotlightStyle: {
            top: insetsTop + 140,
            left: 16,
            width: screenWidth - 32,
            height: 140,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insetsTop + 300,
        };
      case 'list-row':
        return {
          spotlightStyle: {
            top: insetsTop + 470,
            left: 16,
            width: screenWidth - 32,
            height: 110,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 60,
        };
      case 'quick-add':
        return {
          spotlightStyle: {
            bottom: 100,
            right: 20,
            width: 135,
            height: 52,
            borderRadius: Radius.full,
          },
          cardTopPosition: insetsTop + 420,
          badgeStyle: {
            top: -28,
            left: 12,
            width: 110,
            justifyContent: 'center',
          },
        };
    }
  }

  // 3. Budget screen specific coordinates
  if (tourId === 'budget') {
    switch (area) {
      case 'summary-card':
        return {
          spotlightStyle: {
            top: insetsTop + 100,
            left: 16,
            width: screenWidth - 32,
            height: 260,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insetsTop + 380,
        };
      case 'list-row':
        return {
          spotlightStyle: {
            top: insetsTop + 410,
            left: 16,
            width: screenWidth - 32,
            height: 240,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 30,
        };
      case 'payment-row':
        return {
          spotlightStyle: {
            top: insetsTop + 490,
            left: 16,
            width: screenWidth - 32,
            height: 82,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 190,
          badgeStyle: {
            top: -28,
            left: 16,
          },
        };
      case 'quick-add':
        return {
          spotlightStyle: {
            bottom: 85,
            right: 20,
            width: 125,
            height: 52,
            borderRadius: Radius.full,
          },
          cardTopPosition: insetsTop + 140,
          badgeStyle: {
            top: -28,
            left: 12,
            width: 110,
            justifyContent: 'center',
          },
        };
    }
  }

  // 4. Fallback coordinates for shared components (analytics, profile, etc.)
  switch (area) {
    case 'header-card':
      return {
        spotlightStyle: {
          top: insetsTop + 70,
          left: 16,
          width: screenWidth - 32,
          height: 215,
          borderRadius: Radius['2xl'],
        },
        cardTopPosition: insetsTop + 305,
      };
    case 'quick-add':
      return {
        spotlightStyle: {
          bottom: 85,
          right: 18,
          width: 68,
          height: 68,
          borderRadius: 34,
        },
        cardTopPosition: insetsTop + 130,
        badgeStyle: {
          top: -28,
          left: -20,
          width: 108,
          justifyContent: 'center',
        },
      };
    case 'stats-card':
      return {
        spotlightStyle: {
          top: insetsTop + 310,
          left: 16,
          width: screenWidth - 32,
          height: 90,
          borderRadius: Radius.xl,
        },
        cardTopPosition: insetsTop + 415,
      };
    case 'list-row':
      return {
        spotlightStyle: {
          top: insetsTop + 390,
          left: 16,
          width: screenWidth - 32,
          height: 140,
          borderRadius: Radius.xl,
        },
        cardTopPosition: insetsTop + 120,
      };
    case 'summary-card':
      return {
        spotlightStyle: {
          top: insetsTop + 70,
          left: 16,
          width: screenWidth - 32,
          height: 170,
          borderRadius: Radius['2xl'],
        },
        cardTopPosition: insetsTop + 255,
      };
    case 'chart-area':
    default:
      return {
        spotlightStyle: {
          top: insetsTop + 90,
          left: 16,
          width: screenWidth - 32,
          height: 230,
          borderRadius: Radius['2xl'],
        },
        cardTopPosition: insetsTop + 335,
      };
  }
};
