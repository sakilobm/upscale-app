/**
 * @file useAccountsScreen.ts
 * @architecture Business Logic Layer — Headless Screen Hook
 * @description Encapsulates ALL state and business logic for the Accounts screen:
 *   carousel scroll position, add/edit/delete form visibility, animated background
 *   tint, and all CRUD operations delegated to the account store.
 * @associatedFiles src/store/accountStore.ts, src/app/accounts.tsx,
 *   src/components/accounts/AccountFormSheet.tsx
 */

import { useState, useRef, type ComponentProps } from 'react';
import { Dimensions, type NativeSyntheticEvent, type NativeScrollEvent, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useSharedValue, useAnimatedStyle, interpolateColor,
} from 'react-native-reanimated';
import { useAccountStore } from '@store/accountStore';
import { useTheme } from '@hooks/useTheme';
import { toast } from '@store/toastStore';
import type { Account, AccountType, CurrencyCode } from '@store/types';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Layout constants (used by screen for carousel) ───────────────────────────

const { width: SW } = Dimensions.get('window');
export const CARD_H   = 210;
export const CARD_W   = SW - 48;
export const CARD_GAP = 16;
export const PAGE_W   = CARD_W + CARD_GAP;

// ─── Shared form type ─────────────────────────────────────────────────────────

export interface AccountFormState {
  name:      string;
  type:      AccountType;
  color:     string;
  icon:      IoniconName;
  balance:   string;
  currency:  CurrencyCode;
  isDefault: boolean;
}

export const DEFAULT_ACCOUNT_FORM: AccountFormState = {
  name: '', type: 'checking', color: '#6C63FF',
  icon: 'card-outline', balance: '', currency: 'USD', isDefault: false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAccountsScreen() {
  const { colors, isDark } = useTheme();
  const accounts      = useAccountStore((s) => s.accounts);
  const addAccount    = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [formVisible,    setFormVisible]    = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteTarget,   setDeleteTarget]   = useState<Account | null>(null);

  const scrollX   = useSharedValue(0);
  const scrollRef = useRef<ScrollView>(null);

  const bgStyle = useAnimatedStyle(() => {
    if (accounts.length === 0) return { backgroundColor: isDark ? colors.background.card : colors.background.tertiary };
    if (accounts.length === 1) return { backgroundColor: isDark ? accounts[0].color + '22' : accounts[0].color + '14' };
    const inputRange   = accounts.map((_, i) => i * PAGE_W);
    const outputColors = isDark
      ? accounts.map((a) => a.color + '22')
      : accounts.map((a) => a.color + '14');
    return { backgroundColor: interpolateColor(scrollX.value, inputRange, outputColors) };
  });

  const selectedAccount = accounts[selectedIdx] ?? accounts[0] ?? null;
  const totalBalance    = accounts.reduce((s, a) => s + a.balance, 0);
  const accColor        = selectedAccount?.color ?? colors.brand.primary;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    scrollX.value = x;
    const idx = Math.round(x / PAGE_W);
    if (idx !== selectedIdx && idx >= 0 && idx < accounts.length) setSelectedIdx(idx);
  };

  const scrollToIdx = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * PAGE_W, animated: true });
    setSelectedIdx(idx);
  };

  const handleAdd = () => {
    setEditingAccount(null);
    setFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleDeleteConfirm = (account: Account) => {
    if (accounts.length <= 1) { toast.error('Cannot delete the last account'); return; }
    setDeleteTarget(account);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleDeleteExecute = () => {
    if (!deleteTarget) return;
    deleteAccount(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" deleted`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (selectedIdx >= accounts.length - 1) setSelectedIdx(Math.max(0, accounts.length - 2));
    setDeleteTarget(null);
  };

  const handleSetDefault = (account: Account) => {
    accounts.forEach((a) => updateAccount(a.id, { isDefault: a.id === account.id }));
    toast.success(`"${account.name}" set as default`);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleSave = (form: AccountFormState) => {
    if (!form.name.trim()) { toast.error('Account name is required'); return; }
    const balance = parseFloat(form.balance) || 0;

    if (editingAccount) {
      if (form.isDefault) accounts.forEach((a) => { if (a.id !== editingAccount.id) updateAccount(a.id, { isDefault: false }); });
      updateAccount(editingAccount.id, {
        name: form.name.trim(), type: form.type, color: form.color,
        icon: form.icon, balance, currency: form.currency, isDefault: form.isDefault,
      });
      toast.success('Account updated');
    } else {
      if (form.isDefault) accounts.forEach((a) => updateAccount(a.id, { isDefault: false }));
      addAccount({
        id: `acc-${Date.now()}`, userId: 'user-1',
        name: form.name.trim(), type: form.type,
        balance, currency: form.currency,
        color: form.color, icon: form.icon,
        isDefault: form.isDefault || accounts.length === 0,
        createdAt: new Date().toISOString(),
      });
      toast.success(`"${form.name.trim()}" created`);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFormVisible(false);
  };

  return {
    accounts, selectedAccount, totalBalance, accColor, selectedIdx,
    scrollRef, scrollX, bgStyle,
    formSheet: {
      isVisible:      formVisible,
      editingAccount,
      open:           handleAdd,
      close:          () => setFormVisible(false),
    },
    deleteConfirm: {
      target:   deleteTarget,
      dismiss:  () => setDeleteTarget(null),
      confirm:  handleDeleteExecute,
    },
    handlers: {
      scroll:        handleScroll,
      scrollToIdx,
      add:           handleAdd,
      edit:          handleEdit,
      deleteConfirm: handleDeleteConfirm,
      setDefault:    handleSetDefault,
      save:          handleSave,
    },
  };
}
