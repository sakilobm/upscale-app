import { useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { CURRENCY_SYMBOLS, type CurrencyCode } from '@store/types';

interface UseFormatCurrencyReturn {
  format: (amount: number, currency?: CurrencyCode) => string;
  /** Format an amount without the +/- sign prefix. */
  formatAmount: (amount: number) => string;
  symbol: string;
  currency: CurrencyCode;
}

/**
 * Returns the currency symbol for a given currency code.
 * Usable outside of React components (e.g., service layers, share text).
 */
export function getCurrencySymbol(code?: CurrencyCode): string {
  const resolved = code ?? (useAuthStore.getState().user?.currency ?? 'USD');
  return CURRENCY_SYMBOLS[resolved] ?? '$';
}

/**
 * Standalone currency formatter.
 * Reads the user's currency from the auth store snapshot.
 * Usable outside of React components.
 */
export function formatCurrency(amount: number, overrideCurrency?: CurrencyCode): string {
  const userCurrency = useAuthStore.getState().user?.currency ?? 'USD';
  const code = overrideCurrency ?? userCurrency;
  const sym = CURRENCY_SYMBOLS[code] ?? '$';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : ''}${sym}${formatted}`;
}

/**
 * Format an absolute amount with the user's currency symbol (no sign).
 * Useful for display contexts where sign is handled separately.
 */
export function formatAmountShort(amount: number, decimals: number = 0): string {
  const sym = getCurrencySymbol();
  return `${sym}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function useFormatCurrency(): UseFormatCurrencyReturn {
  const user = useAuthStore((s) => s.user);
  const currency: CurrencyCode = user?.currency ?? 'USD';
  const symbol = CURRENCY_SYMBOLS[currency];

  const format = useCallback(
    (amount: number, overrideCurrency?: CurrencyCode) => {
      const code = overrideCurrency ?? currency;
      const sym = CURRENCY_SYMBOLS[code];
      const abs = Math.abs(amount);
      const formatted = abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${amount < 0 ? '-' : ''}${sym}${formatted}`;
    },
    [currency]
  );

  const formatAmount = useCallback(
    (amount: number) => {
      const abs = Math.abs(amount);
      return abs.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    },
    []
  );

  return { format, formatAmount, symbol, currency };
}
