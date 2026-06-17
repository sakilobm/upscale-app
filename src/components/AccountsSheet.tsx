import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { ConfirmModal } from './ConfirmModal';
import { useTheme } from '@hooks/useTheme';
import { useFormatCurrency } from '@hooks/useFormatCurrency';
import { useAccountStore } from '@store/accountStore';
import { toast } from '@store/toastStore';
import { Spacing, Radius } from '@constants/Dimensions';
import type { Account, AccountType } from '@store/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// ─── Seed data ────────────────────────────────────────────────────────────────

export const PRESET_COLORS = [
  '#6C63FF', '#10B981', '#38BDF8', '#F59E0B',
  '#EF4444', '#EC4899', '#8B5CF6', '#84CC16',
  '#FF7043', '#00BCD4',
];

export const PRESET_ICONS: { name: IoniconName; label: string }[] = [
  { name: 'card-outline',            label: 'Card'     },
  { name: 'wallet-outline',          label: 'Wallet'   },
  { name: 'cash-outline',            label: 'Cash'     },
  { name: 'trending-up-outline',     label: 'Invest'   },
  { name: 'business-outline',        label: 'Business' },
  { name: 'people-outline',          label: 'Friends'  },
  { name: 'phone-portrait-outline',  label: 'Digital'  },
  { name: 'gift-outline',            label: 'Gift'     },
  { name: 'home-outline',            label: 'Home'     },
  { name: 'cube-outline',            label: 'Other'    },
];

const ACCOUNT_TYPES: { type: AccountType; label: string; icon: IoniconName }[] = [
  { type: 'checking',   label: 'Checking', icon: 'card-outline'        },
  { type: 'savings',    label: 'Savings',  icon: 'wallet-outline'      },
  { type: 'credit',     label: 'Credit',   icon: 'card'                },
  { type: 'cash',       label: 'Cash',     icon: 'cash-outline'        },
  { type: 'investment', label: 'Invest',   icon: 'trending-up-outline' },
];

const SPRING = { damping: 18, stiffness: 220 };

// ─── Field label ──────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  return (
    <AppText
      variant="labelSM"
      color={colors.text.tertiary}
      style={{ letterSpacing: 0.8, fontSize: 10, marginBottom: Spacing['2'] }}
    >
      {children}
    </AppText>
  );
}

// ─── Account row in list ──────────────────────────────────────────────────────

interface AccountRowProps {
  account: Account;
  cardBg:  string;
  onEdit:  () => void;
  onDelete: () => void;
}

function AccountRow({ account, cardBg, onEdit, onDelete }: AccountRowProps) {
  const { colors } = useTheme();
  const { symbol } = useFormatCurrency();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.97, SPRING, () => {
      scale.value = withSpring(1, SPRING);
    });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={[
          styles.accountRow,
          animStyle,
          {
            backgroundColor: cardBg,
            borderColor:     colors.glass.border,
            shadowColor:     colors.black,
          },
        ]}
      >
        {/* Icon */}
        <View style={[styles.accountIconCircle, { backgroundColor: account.color + '20' }]}>
          <Ionicons name={account.icon as IoniconName} size={22} color={account.color} />
        </View>

        {/* Info */}
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <AppText variant="labelLG" color={colors.text.primary} numberOfLines={1}>
              {account.name}
            </AppText>
            {account.isDefault && (
              <View style={[styles.defaultBadge, { backgroundColor: account.color + '20' }]}>
                <AppText style={{ color: account.color, fontSize: 9, fontWeight: '700' }}>
                  DEFAULT
                </AppText>
              </View>
            )}
          </View>
          <AppText variant="caption" color={colors.text.tertiary} style={{ textTransform: 'capitalize' }}>
            {account.type}
          </AppText>
        </View>

        {/* Balance + actions */}
        <View style={{ alignItems: 'flex-end', gap: Spacing['2'] }}>
          <AppText variant="labelLG" style={{ color: account.color, fontWeight: '700' }}>
            {symbol}{account.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </AppText>
          <View style={{ flexDirection: 'row', gap: Spacing['3'] }}>
            <Pressable onPress={onEdit} hitSlop={10}>
              <Ionicons name="pencil-outline" size={16} color={colors.text.tertiary} />
            </Pressable>
            <Pressable onPress={onDelete} hitSlop={10}>
              <Ionicons name="trash-outline" size={16} color={colors.status.expense + '80'} />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export interface AccountsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function AccountsSheet({ visible, onClose }: AccountsSheetProps) {
  const { colors, isDark } = useTheme();
  const { symbol, currency: userCurrency } = useFormatCurrency();
  const insets = useSafeAreaInsets();

  const accounts      = useAccountStore((s) => s.accounts);
  const addAccount    = useAccountStore((s) => s.addAccount);
  const updateAccount = useAccountStore((s) => s.updateAccount);
  const deleteAccount = useAccountStore((s) => s.deleteAccount);

  // View state
  const [showForm, setShowForm]       = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);

  // Form fields
  const [name,     setName]     = useState('');
  const [accType,  setAccType]  = useState<AccountType>('checking');
  const [balance,  setBalance]  = useState('');
  const [color,    setColor]    = useState(PRESET_COLORS[0]);
  const [iconName, setIconName] = useState<IoniconName>('card-outline');

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);

  // Sheet animations
  const sheetScale   = useSharedValue(0.86);
  const sheetOpacity = useSharedValue(0);
  const formSlide    = useSharedValue(420);
  const listOpacity  = useSharedValue(1);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sheetScale.value }],
    opacity:   sheetOpacity.value,
  }));
  const formStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: formSlide.value }],
  }));
  const listStyle = useAnimatedStyle(() => ({
    opacity: listOpacity.value,
  }));

  const openSheet = () => {
    setShowForm(false);
    formSlide.value   = 420;
    listOpacity.value = 1;
    sheetScale.value   = withSpring(1,   SPRING);
    sheetOpacity.value = withSpring(1,   SPRING);
  };

  const openForm = (account?: Account) => {
    if (account) {
      setEditAccount(account);
      setName(account.name);
      setAccType(account.type);
      setBalance(account.balance.toString());
      setColor(account.color);
      setIconName(account.icon as IoniconName);
    } else {
      setEditAccount(null);
      setName('');
      setAccType('checking');
      setBalance('');
      setColor(PRESET_COLORS[0]);
      setIconName('card-outline');
    }
    setShowForm(true);
    listOpacity.value = withSpring(0, { damping: 20, stiffness: 300 });
    formSlide.value   = withSpring(0, SPRING);
  };

  const closeForm = () => {
    formSlide.value   = withSpring(420, SPRING, () => runOnJS(setShowForm)(false));
    listOpacity.value = withSpring(1, SPRING);
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Account name is required');
      return;
    }
    const parsed = parseFloat(balance);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Enter a valid balance (0 or more)');
      return;
    }
    if (editAccount) {
      updateAccount(editAccount.id, {
        name:    name.trim(),
        type:    accType,
        balance: parsed,
        color,
        icon:    iconName,
      });
      toast.success(`"${name.trim()}" updated`);
    } else {
      addAccount({
        id:        `acc-${Date.now()}`,
        userId:    'user-1',
        name:      name.trim(),
        type:      accType,
        balance:   parsed,
        currency:  userCurrency,
        color,
        icon:      iconName,
        isDefault: accounts.length === 0,
        createdAt: new Date().toISOString(),
      });
      toast.success(`"${name.trim()}" account created`);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeForm();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteAccount(deleteTarget.id);
    toast.success(`"${deleteTarget.name}" removed`);
    setDeleteTarget(null);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const cardBg = colors.surface.sheet;
  const inputBg = colors.surface.input;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={onClose}
        onShow={openSheet}
      >
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <BlurView
            intensity={isDark ? 40 : 28}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay.medium }]} />
        </Pressable>

        {/* Sheet */}
        <Animated.View
          style={[
            styles.sheet,
            sheetStyle,
            {
              backgroundColor: colors.background.primary,
              paddingBottom:   Math.max(insets.bottom, Spacing['5']),
              shadowColor:     colors.black,
            },
          ]}
        >
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.text.tertiary + '40' }]} />

          {/* ── LIST VIEW ──────────────────────────────────────────────── */}
          <Animated.View style={[styles.view, listStyle]}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <AppText variant="headingLG" color={colors.text.primary}>My Accounts</AppText>
                <AppText variant="caption" color={colors.text.tertiary}>
                  Net worth{' '}
                  <AppText
                    variant="caption"
                    style={{ color: colors.brand.primary, fontWeight: '700' }}
                  >
                    {symbol}{totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </AppText>
                </AppText>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={colors.text.tertiary} />
              </Pressable>
            </View>

            {/* Account list */}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            >
              {accounts.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={[styles.emptyIconCircle, { backgroundColor: colors.brand.primary + '15' }]}>
                    <Ionicons name="wallet-outline" size={40} color={colors.brand.primary + '80'} />
                  </View>
                  <AppText variant="headingSM" color={colors.text.secondary} align="center">
                    No accounts yet
                  </AppText>
                  <AppText variant="caption" color={colors.text.tertiary} align="center">
                    Add your bank, cash, or any money{'\n'}source to track it all in one place.
                  </AppText>
                </View>
              ) : (
                accounts.map((account) => (
                  <AccountRow
                    key={account.id}
                    account={account}
                    cardBg={cardBg}
                    onEdit={() => openForm(account)}
                    onDelete={() => setDeleteTarget(account)}
                  />
                ))
              )}
            </ScrollView>

            {/* Add button */}
            <Pressable
              onPress={() => openForm()}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: colors.brand.primary, opacity: pressed ? 0.82 : 1 },
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.brand.onPrimary} />
              <AppText
                variant="labelLG"
                style={{ color: colors.brand.onPrimary, fontWeight: '700' }}
              >
                Add Account
              </AppText>
            </Pressable>
          </Animated.View>

          {/* ── FORM VIEW ──────────────────────────────────────────────── */}
          {showForm && (
            <Animated.View
              style={[
                styles.view,
                styles.formOverlay,
                formStyle,
                { backgroundColor: colors.background.primary },
              ]}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
              >
                {/* Form header */}
                <View style={[styles.sheetHeader, { marginBottom: Spacing['3'] }]}>
                  <Pressable onPress={closeForm} hitSlop={12} style={styles.backRow}>
                    <Ionicons name="arrow-back" size={18} color={colors.brand.primary} />
                    <AppText variant="labelMD" style={{ color: colors.brand.primary }}>Back</AppText>
                  </Pressable>
                  <AppText variant="headingSM" color={colors.text.primary}>
                    {editAccount ? 'Edit Account' : 'New Account'}
                  </AppText>
                  <View style={{ width: 56 }} />
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Preview card */}
                  <View style={[styles.previewCard, { backgroundColor: color }]}>
                    <View style={[styles.previewIconCircle, { backgroundColor: colors.glass.backgroundStrong }]}>
                      <Ionicons name={iconName} size={26} color={colors.white} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ color: colors.white + 'BF', fontSize: 11, letterSpacing: 0.5 }}>
                        {ACCOUNT_TYPES.find((t) => t.type === accType)?.label?.toUpperCase() ?? 'ACCOUNT'}
                      </AppText>
                      <AppText style={{ color: colors.white, fontSize: 17, fontWeight: '800' }}>
                        {name || 'Account Name'}
                      </AppText>
                    </View>
                    <AppText style={{ color: colors.white, fontSize: 18, fontWeight: '800' }}>
                      {symbol}{parseFloat(balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </AppText>
                  </View>

                  {/* Name */}
                  <View style={styles.field}>
                    <FieldLabel>ACCOUNT NAME</FieldLabel>
                    <TextInput
                      style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                      placeholder="e.g. Main Checking, Cash in hand..."
                      placeholderTextColor={colors.text.tertiary}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  {/* Type */}
                  <View style={styles.field}>
                    <FieldLabel>ACCOUNT TYPE</FieldLabel>
                    <View style={styles.typeRow}>
                      {ACCOUNT_TYPES.map((t) => {
                        const active = accType === t.type;
                        return (
                          <Pressable
                            key={t.type}
                            onPress={() => setAccType(t.type)}
                            style={[
                              styles.typeChip,
                              {
                                backgroundColor: active ? color + '20' : inputBg,
                                borderColor:     active ? color + '70' : 'transparent',
                                borderWidth:     1,
                              },
                            ]}
                          >
                            <Ionicons
                              name={t.icon}
                              size={15}
                              color={active ? color : colors.text.tertiary}
                            />
                            <AppText
                              variant="caption"
                              style={{ color: active ? color : colors.text.secondary, fontSize: 11 }}
                            >
                              {t.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Balance */}
                  <View style={styles.field}>
                    <FieldLabel>BALANCE ({symbol})</FieldLabel>
                    <TextInput
                      style={[styles.input, { backgroundColor: inputBg, color: colors.text.primary }]}
                      placeholder="0.00"
                      placeholderTextColor={colors.text.tertiary}
                      value={balance}
                      onChangeText={setBalance}
                      keyboardType="decimal-pad"
                    />
                  </View>

                  {/* Color */}
                  <View style={styles.field}>
                    <FieldLabel>COLOR</FieldLabel>
                    <View style={styles.colorGrid}>
                      {PRESET_COLORS.map((c) => (
                        <Pressable
                          key={c}
                          onPress={() => setColor(c)}
                          style={[
                            styles.colorDot,
                            {
                              backgroundColor: c,
                              transform:        [{ scale: color === c ? 1.18 : 1 }],
                              borderWidth:      color === c ? 2.5 : 0,
                              borderColor:      colors.white,
                              ...Platform.select({
                                ios: {
                                  shadowColor:   c,
                                  shadowOpacity: color === c ? 0.6 : 0,
                                  shadowRadius:  8,
                                  shadowOffset:  { width: 0, height: 2 },
                                },
                              }),
                            },
                          ]}
                        >
                          {color === c && (
                            <Ionicons name="checkmark" size={14} color={colors.white} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Icon */}
                  <View style={styles.field}>
                    <FieldLabel>ICON</FieldLabel>
                    <View style={styles.iconGrid}>
                      {PRESET_ICONS.map((ic) => {
                        const active = iconName === ic.name;
                        return (
                          <Pressable
                            key={ic.name}
                            onPress={() => setIconName(ic.name)}
                            style={[
                              styles.iconOption,
                              {
                                backgroundColor: active ? color + '20' : inputBg,
                                borderColor:     active ? color + '70' : 'transparent',
                                borderWidth:     1,
                              },
                            ]}
                          >
                            <Ionicons
                              name={ic.name}
                              size={22}
                              color={active ? color : colors.text.secondary}
                            />
                            <AppText
                              style={{
                                fontSize:  9,
                                color:     active ? color : colors.text.tertiary,
                                marginTop: 2,
                              }}
                            >
                              {ic.label}
                            </AppText>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>

                  {/* Save */}
                  <Pressable
                    onPress={handleSave}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      { backgroundColor: color, opacity: pressed ? 0.82 : 1, marginTop: Spacing['2'] },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={20} color={colors.white} />
                    <AppText variant="labelLG" style={{ color: colors.white, fontWeight: '700' }}>
                      {editAccount ? 'Save Changes' : 'Create Account'}
                    </AppText>
                  </Pressable>
                </ScrollView>
              </KeyboardAvoidingView>
            </Animated.View>
          )}
        </Animated.View>
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        visible={deleteTarget !== null}
        title={`Delete "${deleteTarget?.name ?? ''}"`}
        message="All transaction links to this account will lose their account reference. This action cannot be undone."
        confirmLabel="Delete"
        danger
        icon="trash-outline"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  sheet: {
    position:             'absolute',
    bottom:               0,
    left:                 0,
    right:                0,
    height:               '88%',
    borderTopLeftRadius:  28,
    borderTopRightRadius: 28,
    paddingHorizontal:    Spacing['5'],
    paddingTop:           Spacing['3'],
    overflow:             'hidden',
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: -6 },
        shadowOpacity: 0.14,
        shadowRadius:  24,
      },
      android: { elevation: 30 },
    }),
  },
  handle: {
    alignSelf:    'center',
    width:        36,
    height:       4,
    borderRadius: 2,
    marginBottom: Spacing['4'],
  },
  view: {
    flex: 1,
  },
  formOverlay: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    bottom:   0,
  },
  sheetHeader: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   Spacing['4'],
  },
  closeBtn: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    width:         56,
  },

  // List
  listContent: {
    gap:           Spacing['3'],
    paddingBottom: Spacing['3'],
  },
  accountRow: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    padding:        Spacing['4'],
    borderRadius:   Radius.xl,
    borderWidth:    1,
    ...Platform.select({
      ios: {
        shadowOffset:  { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius:  8,
      },
      android: { elevation: 2 },
    }),
  },
  accountIconCircle: {
    width:          48,
    height:         48,
    borderRadius:   24,
    alignItems:     'center',
    justifyContent: 'center',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical:   2,
    borderRadius:      Radius.full,
  },
  emptyState: {
    alignItems:  'center',
    paddingVertical: Spacing['10'],
    gap:         Spacing['3'],
  },
  emptyIconCircle: {
    width:          80,
    height:         80,
    borderRadius:   40,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   Spacing['2'],
  },

  // Form
  formContent: {
    gap:           Spacing['4'],
    paddingBottom: Spacing['6'],
  },
  previewCard: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            Spacing['3'],
    padding:        Spacing['4'],
    borderRadius:   Radius.xl,
    height:         90,
    marginBottom:   Spacing['2'],
  },
  previewIconCircle: {
    width:          52,
    height:         52,
    borderRadius:   26,
    alignItems:     'center',
    justifyContent: 'center',
  },
  field: {
    gap: 0,
  },
  input: {
    height:            50,
    borderRadius:      Radius.lg,
    paddingHorizontal: Spacing['4'],
    fontSize:          15,
  },
  typeRow: {
    flexDirection: 'row',
    gap:           Spacing['2'],
    flexWrap:      'wrap',
  },
  typeChip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: Spacing['3'],
    paddingVertical:   8,
    borderRadius:      Radius.lg,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing['3'],
  },
  colorDot: {
    width:          36,
    height:         36,
    borderRadius:   18,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           Spacing['2'],
  },
  iconOption: {
    width:          62,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2'],
    borderRadius:   Radius.lg,
    gap:            2,
  },

  // Shared
  primaryBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'center',
    gap:               Spacing['2'],
    height:            54,
    borderRadius:      Radius.xl,
  },
});
