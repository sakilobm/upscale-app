/**
 * @file accounts.tsx
 * @architecture Presentation Layer — Lean View Shell
 * @description Accounts management screen. Pure declarative orchestrator: reads a
 *   single contract from useAccountsScreen and renders extracted components. Zero
 *   business logic, zero raw useState, zero store imports.
 * @associatedFiles src/features/accounts/hooks/useAccountsScreen.ts,
 *   src/components/accounts/ (AccountCard, AccountDots, AccountStatCard, AccountFormSheet)
 */

import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  useAccountsScreen, CARD_W, PAGE_W,
} from '@features/accounts/hooks/useAccountsScreen';
import { AccountCard } from '@components/accounts/AccountCard';
import { AccountDots } from '@components/accounts/AccountDots';
import { AccountStatCard } from '@components/accounts/AccountStatCard';
import { AccountFormSheet } from '@components/accounts/AccountFormSheet';
import { ConfirmModal } from '@components/ConfirmModal';
import { AppText } from '@components/AppText';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { CURRENCY_SYMBOLS } from '@store/types';
import { Radius } from '@constants/Dimensions';

export default function AccountsScreen() {
  const { colors, isDark } = useTheme();
  const {
    accounts, selectedAccount, totalBalance, accColor, selectedIdx,
    scrollRef, bgStyle, formSheet, deleteConfirm, handlers,
  } = useAccountsScreen();
  const { symbol } = useFormatCurrency();

  return (
    <View style={[s.root, { backgroundColor: colors.background.primary }]}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />

      <SafeAreaView style={s.safeArea} edges={['top']}>
        {/* ── Header ── */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [s.headerBtn, { opacity: pressed ? 0.6 : 1 }]}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </Pressable>
          <View style={s.headerCenter}>
            <AppText variant="headingMD" style={{ color: colors.text.primary, fontWeight: '800' }}>My Accounts</AppText>
            <AppText variant="caption" style={{ color: colors.text.secondary }}>
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </AppText>
          </View>
          <Pressable onPress={handlers.add} style={({ pressed }) => [s.addBtn, { backgroundColor: accColor, opacity: pressed ? 0.8 : 1, shadowColor: colors.black }]}>
            <Ionicons name="add" size={22} color={colors.white} />
          </Pressable>
        </View>

        {/* ── Net Worth ── */}
        <Animated.View entering={FadeIn.delay(100).duration(400)} style={s.hero}>
          <AppText variant="caption" style={{ color: colors.text.secondary, letterSpacing: 1.5 }}>
            TOTAL NET WORTH
          </AppText>
          <AppText style={[s.heroBalance, { color: colors.text.primary }]}>
            {symbol}{totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </AppText>
        </Animated.View>

        {/* ── Carousel ── */}
        {accounts.length === 0 ? (
          <Animated.View entering={FadeIn.duration(400)} style={s.emptyCards}>
            <View style={[s.emptyPlaceholder, { borderColor: colors.text.tertiary + '30' }]}>
              <Ionicons name="wallet-outline" size={40} color={colors.text.tertiary} />
              <AppText variant="bodyMD" color={colors.text.tertiary} style={{ marginTop: 12 }}>No accounts yet</AppText>
              <Pressable onPress={handlers.add} style={[s.emptyAddBtn, { backgroundColor: colors.brand.primary }]}>
                <AppText style={{ color: colors.white, fontWeight: '700' }}>Add First Account</AppText>
              </Pressable>
            </View>
          </Animated.View>
        ) : (
          <>
            <View style={s.carouselWrapper}>
              <ScrollView
                ref={scrollRef} horizontal pagingEnabled={false}
                snapToInterval={PAGE_W} decelerationRate="fast"
                disableIntervalMomentum showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 24, gap: 16 }}
                onScroll={handlers.scroll} scrollEventThrottle={16} style={{ flexGrow: 0 }}
              >
                {accounts.map((acc, i) => (
                  <AccountCard key={acc.id} account={acc} isActive={i === selectedIdx} onPress={() => handlers.edit(acc)} />
                ))}
              </ScrollView>
            </View>
            <AccountDots count={accounts.length} activeIdx={selectedIdx} color={accColor} />
          </>
        )}

        {/* ── Selected Account Detail ── */}
        {selectedAccount && (
          <ScrollView key={selectedAccount.id} showsVerticalScrollIndicator={false} contentContainerStyle={s.details}>
            <View style={s.statsRow}>
              <AccountStatCard label="Balance"  value={`${CURRENCY_SYMBOLS[selectedAccount.currency] ?? '$'}${selectedAccount.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}`} icon="cash-outline"   color={accColor} onPress={() => handlers.edit(selectedAccount)} />
              <AccountStatCard label="Type"     value={selectedAccount.type.charAt(0).toUpperCase() + selectedAccount.type.slice(1)}          icon="layers-outline" color={accColor} />
              <AccountStatCard label="Currency" value={selectedAccount.currency}                                                               icon="globe-outline"  color={accColor} />
            </View>

            <View style={s.actionsRow}>
              <Pressable onPress={() => handlers.edit(selectedAccount)} style={({ pressed }) => [s.actionBtn, { backgroundColor: accColor + '18', opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="pencil" size={16} color={accColor} />
                <AppText variant="labelMD" style={{ color: accColor, fontWeight: '600' }}>Edit</AppText>
              </Pressable>
              {!selectedAccount.isDefault ? (
                <Pressable onPress={() => handlers.setDefault(selectedAccount)} style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.glass.backgroundMid, opacity: pressed ? 0.7 : 1 }]}>
                  <Ionicons name="star-outline" size={16} color={colors.text.secondary} />
                  <AppText variant="labelMD" style={{ color: colors.text.secondary, fontWeight: '600' }}>Set Default</AppText>
                </Pressable>
              ) : (
                <View style={[s.actionBtn, { backgroundColor: accColor + '0F' }]}>
                  <Ionicons name="star" size={16} color={accColor} />
                  <AppText variant="labelMD" style={{ color: accColor, fontWeight: '600' }}>Default</AppText>
                </View>
              )}
              <Pressable onPress={() => handlers.deleteConfirm(selectedAccount)} style={({ pressed }) => [s.actionBtn, { backgroundColor: colors.status.expense + '15', opacity: pressed ? 0.7 : 1 }]}>
                <Ionicons name="trash-outline" size={16} color={colors.status.expense} />
                <AppText variant="labelMD" style={{ color: colors.status.expense, fontWeight: '600' }}>Delete</AppText>
              </Pressable>
            </View>

            <AppText variant="labelMD" style={{ color: colors.text.secondary, marginTop: 24, marginBottom: 12 }}>
              ALL ACCOUNTS
            </AppText>
            <View style={{ gap: 8 }}>
              {accounts.map((acc, idx) => {
                const isSel = idx === selectedIdx;
                return (
                  <Pressable key={acc.id} onPress={() => handlers.scrollToIdx(idx)}
                    style={({ pressed }) => [s.accRow, { backgroundColor: isSel ? acc.color + '18' : colors.glass.background, borderColor: isSel ? acc.color + '40' : 'transparent', opacity: pressed ? 0.75 : 1 }]}
                  >
                    <View style={[s.accRowIcon, { backgroundColor: acc.color + '22' }]}>
                      <Ionicons name={acc.icon as any} size={18} color={acc.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="labelMD" style={{ color: colors.text.primary, fontWeight: '600' }}>{acc.name}</AppText>
                      <AppText variant="caption" style={{ color: colors.text.secondary }}>{acc.type}</AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="labelMD" style={{ color: acc.color, fontWeight: '700' }}>{CURRENCY_SYMBOLS[acc.currency] ?? '$'}{acc.balance.toLocaleString('en-US', { minimumFractionDigits: 0 })}</AppText>
                      {acc.isDefault && <AppText variant="caption" style={{ color: acc.color + 'AA', fontSize: 10 }}>default</AppText>}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <AccountFormSheet
        visible={formSheet.isVisible}
        editingAccount={formSheet.editingAccount}
        onClose={formSheet.close}
        onSave={handlers.save}
      />
      <ConfirmModal
        visible={!!deleteConfirm.target}
        title="Delete Account"
        message={`Delete "${deleteConfirm.target?.name}"? This cannot be undone.`}
        confirmLabel="Delete" danger
        onConfirm={deleteConfirm.confirm}
        onCancel={deleteConfirm.dismiss}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  safeArea: { flex: 1 },

  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerBtn:    { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 1 },
  addBtn: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      ios:     { shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 6 },
    }),
  },

  hero:        { alignItems: 'center', paddingTop: 4, paddingBottom: 20, gap: 6 },
  heroBalance: { fontSize: 36, fontWeight: '800', letterSpacing: -0.5, lineHeight: 50, includeFontPadding: false },

  carouselWrapper: { paddingVertical: 14 },

  emptyCards:       { alignItems: 'center', paddingVertical: 24, paddingHorizontal: 24 },
  emptyPlaceholder: { width: CARD_W, height: 210, borderRadius: Radius.xl, borderWidth: 2, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  emptyAddBtn:      { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full },

  details:    { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },
  statsRow:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full },

  accRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: Radius.lg, borderWidth: 1 },
  accRowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
