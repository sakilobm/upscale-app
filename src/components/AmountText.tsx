import React, { memo } from 'react';
import { TextStyle } from 'react-native';
import { AppText } from './AppText';
import { Typography } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { CURRENCY_SYMBOLS, type CurrencyCode, type TransactionType } from '@store/types';

interface AmountTextProps {
  amount: number;
  currency?: CurrencyCode;
  type?: TransactionType | 'balance' | 'savings';
  variant?: keyof typeof Typography;
  showSign?: boolean;
  style?: TextStyle;
}

export const AmountText = memo(function AmountText({
  amount,
  currency = 'USD',
  type = 'balance',
  variant = 'headingMD',
  showSign = true,
  style,
}: AmountTextProps) {
  const { colors } = useTheme();
  const symbol = CURRENCY_SYMBOLS[currency];
  const absAmount = Math.abs(amount);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const sign = showSign && type !== 'balance'
    ? type === 'income' ? '+' : type === 'expense' ? '-' : ''
    : '';

  const color =
    type === 'income' ? colors.status.income :
    type === 'expense' ? colors.status.expense :
    type === 'savings' ? colors.status.savings :
    colors.text.primary;

  return (
    <AppText variant={variant} color={color} style={style}>
      {sign}{symbol}{formatted}
    </AppText>
  );
});
