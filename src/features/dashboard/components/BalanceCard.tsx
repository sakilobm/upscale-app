import React, { memo, useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Dimensions, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@components/AppText';
import { Radius, Spacing, BlurConfigs } from '@constants/index';
import { useTheme } from '@hooks/useTheme';
import { useAccountStore } from '@store/accountStore';
import { CURRENCY_SYMBOLS } from '@store/types';
import type { BalanceCardProps } from '../types';

const CARD_HEIGHT = Math.max(Math.round(Dimensions.get('window').height * 0.22), 200);

function formatBalance(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const BalanceCard = memo(function BalanceCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
}: BalanceCardProps) {
  const { isDark } = useTheme();
  const [showAccounts, setShowAccounts] = useState(false);

  if (!isDark) {
    return (
      <LightCard
        totalBalance={totalBalance}
        monthSummary={monthSummary}
        isLoading={isLoading}
        currency={currency}
        showAccounts={showAccounts}
        onToggleAccounts={() => setShowAccounts(!showAccounts)}
      />
    );
  }
  return (
    <DarkCard
      totalBalance={totalBalance}
      monthSummary={monthSummary}
      isLoading={isLoading}
      currency={currency}
      showAccounts={showAccounts}
      onToggleAccounts={() => setShowAccounts(!showAccounts)}
    />
  );
});

interface InternalCardProps extends BalanceCardProps {
  showAccounts: boolean;
  onToggleAccounts: () => void;
}

const LightCard = memo(function LightCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
  showAccounts,
  onToggleAccounts,
}: InternalCardProps) {
  const { colors } = useTheme();
  const accounts = useAccountStore((s) => s.accounts);
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';

  const toggleX = useSharedValue(showAccounts ? 14 : 0);
  useEffect(() => {
    toggleX.value = withSpring(showAccounts ? 14 : 0, { damping: 15, stiffness: 150 });
  }, [showAccounts]);

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value }],
  }));

  return (
    <View style={[styles.container, lightStyles.container, { shadowColor: colors.brand.primary, borderColor: colors.balanceCard.containerBorder }]}>
      {/* Background neon gradient base */}
      <LinearGradient
        colors={colors.balanceCard.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />

      {/* Decorative large shapes placed behind the blur to appear as liquid refractive elements */}
      <Text style={[styles.decorAsterisk, { color: colors.black + '26' }]} allowFontScaling={false}>✳</Text>
      <Text style={[styles.decorAsteriskSm, { color: colors.black + '1C' }]} allowFontScaling={false}>✳</Text>

      {/* Glassmorphic frosted blur layer */}
      <BlurView
        intensity={70}
        tint="light"
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />

      {/* Liquid glow orbs to refract light */}
      <View style={[lightStyles.glowTopRight, { backgroundColor: colors.balanceCard.glowTopRight }]} />
      <View style={[lightStyles.glowBottomLeft, { backgroundColor: colors.balanceCard.glowBottomLeft }]} />
      <View style={[lightStyles.border, { borderRadius: Radius['2xl'], borderColor: colors.balanceCard.innerBorder }]} />

      <View style={styles.content}>
        {/* Top row: card name + currency */}
        <View style={styles.cardTopRow}>
          <View style={styles.cardNameRow}>
            <Pressable onPress={onToggleAccounts} hitSlop={8}>
              <View style={[styles.toggleTrack, { backgroundColor: showAccounts ? '#8EB41F' : colors.black }]}>
                <Animated.View style={[styles.toggleThumb, toggleStyle, { backgroundColor: colors.white }]} />
              </View>
            </Pressable>
            <AppText
              variant="labelMD"
              color={colors.balanceCard.titleColor}
              style={styles.cardName}
            >
              {showAccounts ? 'My Accounts' : 'MoneyCard'}
            </AppText>
          </View>
          <View style={styles.currencyChip}>
            <AppText variant="labelSM" color={colors.balanceCard.valueColor}>{currency}</AppText>
          </View>
        </View>

        {showAccounts ? (
          accounts.length === 0 ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 90 }}>
              <Ionicons name="wallet-outline" size={24} color={colors.balanceCard.titleColor} style={{ opacity: 0.4, marginBottom: 4 }} />
              <AppText variant="caption" style={{ color: colors.balanceCard.titleColor, opacity: 0.6 }}>
                No accounts found. Add one to start.
              </AppText>
            </View>
          ) : (
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 110, marginTop: 12 }}
              contentContainerStyle={{ gap: 8 }}
            >
              {accounts.map((acc, idx) => (
                <View
                  key={acc.id}
                  style={[
                    styles.accountRow,
                    idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 6 }
                  ]}
                >
                  <View style={[styles.accountIconCircle, { backgroundColor: acc.color + '22' }]}>
                    <Ionicons name={acc.icon as any} size={13} color={acc.color} />
                  </View>
                  <AppText variant="labelMD" style={{ color: colors.balanceCard.titleColor, fontWeight: '600', flex: 1 }}>
                    {acc.name}
                  </AppText>
                  <AppText variant="labelMD" style={{ color: colors.balanceCard.titleColor, fontWeight: '800' }}>
                    {CURRENCY_SYMBOLS[acc.currency] ?? '$'}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </AppText>
                </View>
              ))}
            </ScrollView>
          )
        ) : (
          <>
            {/* Card number strip */}
            <View style={[styles.cardNumberStrip, { backgroundColor: colors.black + 'D1' }]}>
              <AppText variant="labelMD" color={colors.white} style={styles.cardDots}>
                ●●●●  ●●●●  ●●●●  4829
              </AppText>
            </View>

            {/* Bottom row: balance + expiry */}
            <View style={styles.cardBottomRow}>
              <View>
                <AppText variant="labelSM" color={colors.balanceCard.labelColor} style={styles.balanceLabel}>
                  Your Balance
                </AppText>
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.balanceCard.balanceColor} style={styles.loader} />
                ) : (
                  <AppText
                    variant="numericLG"
                    color={colors.balanceCard.balanceColor}
                    style={styles.balanceAmount}
                  >
                    {sym}{formatBalance(totalBalance)}
                  </AppText>
                )}
              </View>
              <AppText variant="labelMD" color={colors.balanceCard.valueColor}>
                09/26
              </AppText>
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const DarkCard = memo(function DarkCard({
  totalBalance,
  monthSummary,
  isLoading,
  currency,
  showAccounts,
  onToggleAccounts,
}: InternalCardProps) {
  const { colors } = useTheme();
  const accounts = useAccountStore((s) => s.accounts);
  const sym = CURRENCY_SYMBOLS[currency] ?? '$';

  const toggleX = useSharedValue(showAccounts ? 14 : 0);
  useEffect(() => {
    toggleX.value = withSpring(showAccounts ? 14 : 0, { damping: 15, stiffness: 150 });
  }, [showAccounts]);

  const toggleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: toggleX.value }],
  }));

  return (
    <View style={[styles.container, darkStyles.container, { shadowColor: colors.brand.primary, borderColor: colors.balanceCard.containerBorder }]}>
      {/* Background gradient base */}
      <LinearGradient
        colors={colors.balanceCard.gradient as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />
      <BlurView
        intensity={BlurConfigs.card.intensity}
        tint="dark"
        style={[StyleSheet.absoluteFill, { borderRadius: Radius['2xl'] }]}
      />
      <View style={[darkStyles.glowTopRight, { backgroundColor: colors.balanceCard.glowTopRight }]} />
      <View style={[darkStyles.glowBottomLeft, { backgroundColor: colors.balanceCard.glowBottomLeft }]} />
      <View style={[darkStyles.border, { borderRadius: Radius['2xl'], borderColor: colors.balanceCard.innerBorder }]} />

      <View style={styles.content}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <AppText variant="labelMD" color={colors.balanceCard.labelColor} style={darkStyles.label}>
            {showAccounts ? 'ACCOUNT BALANCES' : 'TOTAL BALANCE'}
          </AppText>
          <Pressable onPress={onToggleAccounts} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="labelSM" style={{ color: colors.brand.primary, fontWeight: '700', fontSize: 10 }}>ACCOUNTS</AppText>
            <View style={[styles.toggleTrack, { width: 30, height: 16, paddingHorizontal: 2, borderRadius: 8, backgroundColor: showAccounts ? colors.brand.primary : colors.glass.borderStrong }]}>
              <Animated.View style={[styles.toggleThumb, { width: 12, height: 12, borderRadius: 6 }, toggleStyle, { backgroundColor: colors.white }]} />
            </View>
          </Pressable>
        </View>

        {showAccounts ? (
          <>
            <View style={[darkStyles.divider, { backgroundColor: colors.glass.border, marginVertical: 8 }]} />
            {accounts.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 90 }}>
                <Ionicons name="wallet-outline" size={24} color={colors.text.secondary} style={{ opacity: 0.4, marginBottom: 4 }} />
                <AppText variant="caption" style={{ color: colors.text.secondary, opacity: 0.6 }}>
                  No accounts found. Add one to start.
                </AppText>
              </View>
            ) : (
              <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 110 }}
                contentContainerStyle={{ gap: 2 }}
              >
                {accounts.map((acc, idx) => (
                  <View
                    key={acc.id}
                    style={[
                      styles.accountRow,
                      { paddingVertical: 6 },
                      idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.glass.border, paddingTop: 6 }
                    ]}
                  >
                    <View style={[styles.accountIconCircle, { backgroundColor: acc.color + '22', width: 28, height: 28, borderRadius: 8 }]}>
                      <Ionicons name={acc.icon as any} size={14} color={acc.color} />
                    </View>
                    <AppText variant="labelMD" style={{ color: colors.text.primary, fontWeight: '600', flex: 1 }}>
                      {acc.name}
                    </AppText>
                    <AppText variant="labelMD" style={{ color: acc.color, fontWeight: '800' }}>
                      {CURRENCY_SYMBOLS[acc.currency] ?? '$'}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        ) : (
          <>
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.balanceCard.balanceColor} style={styles.loader} />
            ) : (
              <AppText variant="numericLG" color={colors.balanceCard.balanceColor} style={darkStyles.balance}>
                {sym}{formatBalance(totalBalance)}
              </AppText>
            )}

            <View style={[darkStyles.divider, { backgroundColor: colors.glass.border }]} />

            <View style={darkStyles.statsRow}>
              <View style={darkStyles.statItem}>
                <AppText variant="labelSM" color={colors.balanceCard.labelColor}>INCOME</AppText>
                <AppText variant="headingSM" color={colors.status.income}>
                  +{sym}{formatBalance(monthSummary.totalIncome)}
                </AppText>
              </View>
              <View style={[darkStyles.statDivider, { backgroundColor: colors.glass.border }]} />
              <View style={darkStyles.statItem}>
                <AppText variant="labelSM" color={colors.balanceCard.labelColor}>EXPENSES</AppText>
                <AppText variant="headingSM" color={colors.status.expense}>
                  -{sym}{formatBalance(monthSummary.totalExpense)}
                </AppText>
              </View>
              <View style={[darkStyles.statDivider, { backgroundColor: colors.glass.border }]} />
              <View style={darkStyles.statItem}>
                <AppText variant="labelSM" color={colors.balanceCard.labelColor}>SAVINGS</AppText>
                <AppText
                  variant="headingSM"
                  color={monthSummary.netSavings >= 0 ? colors.status.income : colors.status.expense}
                >
                  {monthSummary.netSavings >= 0 ? '+' : '-'}{sym}{formatBalance(Math.abs(monthSummary.netSavings))}
                </AppText>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    height: CARD_HEIGHT,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    padding: Spacing['5'],
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleTrack: {
    width: 34,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleThumb: {
    width: 14,
    height: 14,
    borderRadius: 7,
    alignSelf: 'flex-start',
  },
  cardName: {
    fontWeight: '700',
  },
  currencyChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  cardNumberStrip: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: Spacing['4'],
    marginVertical: 2,
  },
  cardDots: {
    letterSpacing: 2,
    fontSize: 12,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  balanceLabel: {
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  balanceAmount: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  loader: {
    alignSelf: 'flex-start',
    marginVertical: Spacing['2'],
  },
  decorAsterisk: {
    position: 'absolute',
    right: -20,
    top: -40,
    fontSize: 200,
    lineHeight: 210,
  },
  decorAsteriskSm: {
    position: 'absolute',
    left: -30,
    bottom: -30,
    fontSize: 100,
    lineHeight: 110,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  accountIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const darkStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  glowTopRight: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.12,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.08,
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
  },
  label: {
    letterSpacing: 2,
  },
  balance: {
    marginTop: 4,
  },
  divider: {
    height: 1,
    marginVertical: Spacing['3'],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing['3'],
  },
});

const lightStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 8,
  },
  glowTopRight: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.35,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    opacity: 0.20,
  },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
  },
});

