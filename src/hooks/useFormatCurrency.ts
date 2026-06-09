import { useCallback } from 'react';
import { useAuthStore } from '@store/authStore';
import { CURRENCY_SYMBOLS, type CurrencyCode } from '@store/types';

interface UseFormatCurrencyReturn {
  format: (amount: number, currency?: CurrencyCode) => string;
  symbol: string;
  currency: CurrencyCode;
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

  return { format, symbol, currency };
}
