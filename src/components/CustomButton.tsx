import React, { memo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  Pressable,
  View,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@constants/index';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'income' | 'expense';
type ButtonSize = 'sm' | 'md' | 'lg';

interface CustomButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  haptic?: boolean;
}

const CONSTANTS = {
  variants: {
    primary: {
      gradient: Colors.gradients.purpleBlue as unknown as [string, string],
      textColor: Colors.white,
    },
    secondary: {
      gradient: null as null,
      background: Colors.glass.backgroundMid,
      textColor: Colors.text.primary,
      borderColor: Colors.glass.border,
    },
    ghost: {
      gradient: null as null,
      background: Colors.transparent,
      textColor: Colors.brand.secondary,
      borderColor: Colors.transparent,
    },
    danger: {
      gradient: Colors.gradients.orangeRed as unknown as [string, string],
      textColor: Colors.white,
    },
    income: {
      gradient: Colors.gradients.income as unknown as [string, string],
      textColor: Colors.white,
    },
    expense: {
      gradient: Colors.gradients.expense as unknown as [string, string],
      textColor: Colors.white,
    },
  },
  sizes: {
    sm: { height: 38, paddingH: Spacing['4'], fontSize: 13, radius: Radius.md },
    md: { height: 50, paddingH: Spacing['6'], fontSize: 15, radius: Radius.lg },
    lg: { height: 58, paddingH: Spacing['7'], fontSize: 17, radius: Radius.xl },
  },
} as const;

export const CustomButton = memo(function CustomButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  labelStyle,
  haptic = true,
}: CustomButtonProps) {
  const variantConfig = CONSTANTS.variants[variant];
  const sizeConfig = CONSTANTS.sizes[size];
  const isDisabled = disabled || isLoading;

  const handlePress = useCallback(() => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [haptic, onPress]);

  const containerStyle: ViewStyle = {
    height: sizeConfig.height,
    borderRadius: sizeConfig.radius,
    overflow: 'hidden',
    opacity: isDisabled ? 0.5 : 1,
  };

  const innerStyle: ViewStyle = {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing['2'],
    paddingHorizontal: sizeConfig.paddingH,
  };

  const textStyle: TextStyle = {
    ...Typography.labelLG,
    fontSize: sizeConfig.fontSize,
    color: variantConfig.textColor,
  };

  const renderInner = () => (
    <View style={innerStyle}>
      {!isLoading && leftIcon}
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variantConfig.textColor}
        />
      ) : (
        <Text style={[textStyle, labelStyle]}>{label}</Text>
      )}
      {!isLoading && rightIcon}
    </View>
  );

  if ('gradient' in variantConfig && variantConfig.gradient) {
    return (
      <Pressable
        onPress={handlePress}
        disabled={isDisabled}
        style={({ pressed }) => [
          containerStyle,
          styles.shadow,
          { opacity: pressed ? 0.88 : isDisabled ? 0.5 : 1 },
          style,
        ]}
      >
        <LinearGradient
          colors={variantConfig.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {renderInner()}
      </Pressable>
    );
  }

  const nonGradientVariant = variantConfig as {
    gradient: null;
    background: string;
    textColor: string;
    borderColor: string;
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      style={({ pressed }) => [
        containerStyle,
        {
          backgroundColor: nonGradientVariant.background,
          borderWidth: nonGradientVariant.borderColor !== Colors.transparent ? 1 : 0,
          borderColor: nonGradientVariant.borderColor,
          opacity: pressed ? 0.8 : isDisabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {renderInner()}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  shadow: {
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
