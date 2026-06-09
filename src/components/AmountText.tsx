import React, { memo } from 'react';
import { TextStyle } from 'react-native';
import { AppText } from './AppText';
import { Colors, Typography } from '@constants/index';
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
    type === 'income' ? Colors.status.income :
    type === 'expense' ? Colors.status.expense :
    type === 'savings' ? Colors.status.savings :
    Colors.text.primary;

  return (
    <AppText variant={variant} color={color} style={style}>
      {sign}{symbol}{formatted}
    </AppText>
  );
});
