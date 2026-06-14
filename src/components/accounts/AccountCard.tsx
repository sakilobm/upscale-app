/**
 * @file AccountCard.tsx
 * @architecture Presentation Layer — Extracted Component
 * @description Credit-card-style account card with gradient background, decorative
 *   blobs, chip element, and spring scale animation tied to carousel active state.
 * @associatedFiles src/app/accounts.tsx, src/features/accounts/hooks/useAccountsScreen.ts
 */

import { useEffect, type ComponentProps } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppText } from '@components/AppText';
import { Radius } from '@constants/Dimensions';
import type { Account } from '@store/types';
import { CARD_W, CARD_H } from '@features/accounts/hooks/useAccountsScreen';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  account:  Account;
  isActive: boolean;
}

export function AccountCard({ account, isActive }: Props) {
  const scale = useSharedValue(isActive ? 1 : 0.93);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1 : 0.93, { damping: 18, stiffness: 200 });
  }, [isActive]);

  const cardStyle = useAnimatedStyle(() => ({
    transform:    [{ scale: scale.value }],
    shadowOpacity: isActive ? 0.45 : 0.15,
  }));

  return (
    <View style={{ width: CARD_W }}>
      <Animated.View style={[s.shadow, { shadowColor: account.color }, cardStyle]}>
        <View style={s.clip}>
          <LinearGradient
            colors={[account.color, account.color + 'CC']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.blob1} />
          <View style={s.blob2} />
          <View style={s.blob3} />
          <View style={s.chip}><View style={s.chipInner} /></View>

          <View style={s.content}>
            <View style={s.top}>
              <View style={s.iconCircle}>
                <Ionicons name={account.icon as IoniconName} size={22} color="#FFF" />
              </View>
              <View style={s.typePill}>
                <AppText style={s.typeText}>{account.type.toUpperCase()}</AppText>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <AppText style={s.balanceLabel}>BALANCE</AppText>
              <AppText style={s.balanceValue}>
                {account.currency} {account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </AppText>
              <AppText style={s.accountName}>{account.name}</AppText>
            </View>

            <View style={s.bottom}>
              {account.isDefault && (
                <View style={s.defaultBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="rgba(255,255,255,0.9)" />
                  <AppText style={s.defaultText}>DEFAULT</AppText>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <AppText style={s.currencyCode}>{account.currency}</AppText>
            </View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  shadow: {
    borderRadius: Radius.xl,
    ...Platform.select({
      ios:     { shadowOffset: { width: 0, height: 12 }, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  clip: {
    width: CARD_W, height: CARD_H,
    borderRadius: Radius.xl, overflow: 'hidden',
  },
  blob1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.14)', top: -60, right: -50 },
  blob2: { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(255,255,255,0.07)', bottom: -40, left: 40 },
  blob3: { position: 'absolute', width: 80,  height: 80,  borderRadius: 40,  backgroundColor: 'rgba(255,255,255,0.06)', top: 20, left: -20 },
  chip:      { position: 'absolute', top: 20, left: 20, width: 32, height: 24, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  chipInner: { width: 22, height: 16, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  content: { flex: 1, padding: 20, paddingTop: 16, justifyContent: 'space-between' },
  top:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.2)' },
  typeText:     { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  balanceLabel: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5 },
  balanceValue: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  accountName:  { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.2 },
  defaultBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  defaultText:  { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  currencyCode: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
});
