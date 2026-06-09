import React from 'react';
import { Pressable, StyleSheet, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { Radius } from '@constants/Dimensions';
import type { LedgerEntry } from '@store/ledgerStore';

interface NudgeButtonProps {
  entry: LedgerEntry;
  size?: number;
}

export function NudgeButton({ entry, size = 32 }: NudgeButtonProps) {
  const { colors, isDark } = useTheme();

  const remaining = entry.totalAmount - entry.amountReturned;
  const directionPhrase =
    entry.direction === 'OWED_TO_ME'
      ? `Hey ${entry.personName}, just a friendly reminder — you owe me $${remaining.toFixed(2)}. ${entry.note ? `(${entry.note})` : ''} Let me know when it's convenient. 🙏`
      : `Hi ${entry.personName}, I wanted to check in about the $${remaining.toFixed(2)} I owe you. ${entry.note ? `(${entry.note})` : ''} I'll sort it out soon!`;

  const handleNudge = async () => {
    try {
      await Share.share({
        message: directionPhrase,
        title:   `Money reminder for ${entry.personName}`,
      });
    } catch {
      // user cancelled or share sheet unavailable — silent fail
    }
  };

  return (
    <Pressable
      onPress={handleNudge}
      style={({ pressed }) => [
        styles.btn,
        {
          width:           size,
          height:          size,
          borderRadius:    size / 2,
          backgroundColor: isDark ? colors.brand.accent + '22' : colors.brand.accent + '18',
          borderColor:     colors.brand.accent + '44',
          opacity:         pressed ? 0.65 : 1,
        },
      ]}
      android_ripple={{ color: colors.brand.accent + '30', borderless: true }}
    >
      <Ionicons name="share-social-outline" size={size * 0.45} color={colors.brand.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems:     'center',
    justifyContent: 'center',
    borderWidth:    1,
  },
});
