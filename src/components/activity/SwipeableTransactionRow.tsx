/**
 * @file SwipeableTransactionRow.tsx
 * @architecture Presentation Layer — UI Component
 * @description A swipeable transaction row: swipe left to reveal a red delete action.
 *   Velocity-based dismiss threshold fires onDelete after a slide-out animation.
 * @associatedFiles src/features/transactions/components/TransactionListItem.tsx,
 *   src/app/(tabs)/transactions.tsx
 */

import React, { useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { TransactionListItem } from '@features/transactions/components/TransactionListItem';
import { useTheme } from '@hooks/useTheme';
import type { Transaction } from '@store/types';

const DELETE_W = 72;
const SNAP_AT  = DELETE_W / 2;

interface Props {
  tx:       Transaction;
  onDelete: () => void;
  onPress:  (tx: Transaction) => void;
}

export function SwipeableTransactionRow({ tx, onDelete, onPress }: Props) {
  const { colors } = useTheme();
  const cardBg = colors.surface.sheet;
  const translateX = useSharedValue(0);
  const rowOpacity = useSharedValue(1);
  const swipedRef  = useRef(false);

  const dismiss = () => {
    translateX.value = withTiming(-400, { duration: 260 });
    rowOpacity.value = withTiming(0,    { duration: 200 });
    setTimeout(onDelete, 240);
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-10, 10000])
    .failOffsetY([-12, 12])
    .onBegin(() => { swipedRef.current = false; })
    .onUpdate((e) => {
      if (e.translationX < -5) swipedRef.current = true;
      translateX.value = Math.min(Math.max(e.translationX, -(DELETE_W + 8)), 0);
    })
    .onEnd((e) => {
      if (e.velocityX < -600 || e.translationX < -180) {
        dismiss();
      } else if (e.translationX < -SNAP_AT) {
        translateX.value = withSpring(-DELETE_W, { damping: 20, stiffness: 200 });
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
        setTimeout(() => { swipedRef.current = false; }, 100);
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform:       [{ translateX: translateX.value }],
    opacity:         rowOpacity.value,
    backgroundColor: cardBg,
  }));

  return (
    <View style={s.wrapper}>
      <Pressable onPress={dismiss} style={[s.deleteAction, { backgroundColor: colors.status.expense }]}>
        <Ionicons name="trash-outline" size={17} color={colors.white} />
      </Pressable>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={rowStyle}>
          <TransactionListItem
            transaction={tx}
            onPress={(t) => {
              if (swipedRef.current) {
                translateX.value = withSpring(0, { damping: 20, stiffness: 250 });
                setTimeout(() => { swipedRef.current = false; }, 100);
              } else {
                onPress(t);
              }
            }}
          />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden' },
  deleteAction: {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: DELETE_W, alignItems: 'center', justifyContent: 'center',
  },
});
