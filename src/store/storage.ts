import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

export const zustandStorage = createJSONStorage(() => AsyncStorage);

// Clears every persisted store key so the app starts fresh
export async function clearAllPersistedData(): Promise<void> {
  const keys = [
    'wc-transactions',
    'wc-accounts',
    'wc-categories',
    'wc-budgets',
    'wc-planned-payments',
    'wc-ledger',
    'wc-loans',
    'wc-theme',
    'wc-notifications',
  ];
  await AsyncStorage.multiRemove(keys);
}
