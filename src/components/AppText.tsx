import React, { memo } from 'react';
import { Text, TextStyle, TextProps } from 'react-native';
import { Typography, Colors } from '@constants/index';

type TextVariant = keyof typeof Typography;

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: TextStyle['textAlign'];
  children: React.ReactNode;
}

export const AppText = memo(function AppText({
  variant = 'bodyMD',
  color = Colors.text.primary,
  align,
  style,
  children,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        Typography[variant],
        { color, textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </Text>
  );
});
