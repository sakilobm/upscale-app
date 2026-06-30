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
            top: insetsTop + 70,
            left: 16,
            width: screenWidth - 32,
            height: 140,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insetsTop + 230,
        };
      case 'list-row':
        return {
          spotlightStyle: {
            top: insetsTop + 230,
            left: 16,
            width: screenWidth - 32,
            height: 110,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 360,
        };
    }
  }

  // 3. Budget screen specific coordinates
  if (tourId === 'budget') {
    switch (area) {
      case 'summary-card':
        return {
          spotlightStyle: {
            top: insetsTop + 70,
            left: 16,
            width: screenWidth - 32,
            height: 160,
            borderRadius: Radius['2xl'],
          },
          cardTopPosition: insetsTop + 250,
        };
      case 'list-row':
        return {
          spotlightStyle: {
            top: insetsTop + 340,
            left: 16,
            width: screenWidth - 32,
            height: 100,
            borderRadius: Radius.xl,
          },
          cardTopPosition: insetsTop + 120,
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
