import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAccountStore } from './accountStore';
import { useTransactionStore } from './transactionStore';
import { useBudgetStore } from './budgetStore';
import { useLedgerStore } from './ledgerStore';
import { usePlannedPaymentsStore } from './plannedPaymentsStore';
import { useLoansStore } from './loansStore';
import { useNotificationStore } from './notificationStore';
import { format, subDays, addDays } from 'date-fns';
import type { Account, Transaction, Budget } from './types';
import type { LedgerEntry } from './ledgerStore';
import type { PlannedPayment } from './plannedPaymentsStore';
import type { Loan } from './loansStore';
import type { AppNotification, NotificationReminder } from './notificationStore';

/**
 * Checks if a demo snapshot exists in AsyncStorage.
 */
export async function hasDemoSnapshot(): Promise<boolean> {
  const data = await AsyncStorage.getItem('wc_demo_snapshot_data');
  return !!data;
}

/**
 * Restores the user's data from the captured snapshot and deletes the snapshot key.
 */
export async function undoDemoData(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem('wc_demo_snapshot_data');
    if (!raw) return false;
    const snapshot = JSON.parse(raw);

    useAccountStore.setState({ accounts: snapshot.accounts || [], activeAccountId: snapshot.activeAccountId || null });
    useTransactionStore.setState({ transactions: snapshot.transactions || [] });
    useBudgetStore.setState({ budgets: snapshot.budgets || [] });
    useLedgerStore.setState({ entries: snapshot.entries || [] });
    usePlannedPaymentsStore.setState({ payments: snapshot.payments || [] });
    useLoansStore.setState({ loans: snapshot.loans || [] });
    useNotificationStore.setState({ 
      notifications: snapshot.notifications || [], 
      reminders: snapshot.reminders || [] 
    });

    await AsyncStorage.removeItem('wc_demo_snapshot_data');
    return true;
  } catch (error) {
    console.error('Failed to undo demo data:', error);
    return false;
  }
}

/**
 * Seeds all Zustand stores with high-quality, realistic mock data
 * designed specifically for Play Store screenshots.
 * Captures a backup snapshot of current data before overwriting.
 */
export async function seedDemoData(): Promise<void> {
  // Capture current state snapshot before modifying anything, if it doesn't already exist
  const alreadyHasSnapshot = await AsyncStorage.getItem('wc_demo_snapshot_data');
  if (!alreadyHasSnapshot) {
    const currentSnapshot = {
      accounts: useAccountStore.getState().accounts,
      activeAccountId: useAccountStore.getState().activeAccountId,
      transactions: useTransactionStore.getState().transactions,
      budgets: useBudgetStore.getState().budgets,
      entries: useLedgerStore.getState().entries,
      payments: usePlannedPaymentsStore.getState().payments,
      loans: useLoansStore.getState().loans,
      notifications: useNotificationStore.getState().notifications,
      reminders: useNotificationStore.getState().reminders,
    };
    await AsyncStorage.setItem('wc_demo_snapshot_data', JSON.stringify(currentSnapshot));
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const twoDaysAgoStr = format(subDays(new Date(), 2), 'yyyy-MM-dd');
  const threeDaysAgoStr = format(subDays(new Date(), 3), 'yyyy-MM-dd');
  const fiveDaysAgoStr = format(subDays(new Date(), 5), 'yyyy-MM-dd');
  const tenDaysAgoStr = format(subDays(new Date(), 10), 'yyyy-MM-dd');
  const fifteenDaysAgoStr = format(subDays(new Date(), 15), 'yyyy-MM-dd');
  
  const inOneDayStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const inThreeDaysStr = format(addDays(new Date(), 3), 'yyyy-MM-dd');
  const inFiveDaysStr = format(addDays(new Date(), 5), 'yyyy-MM-dd');
  const inFifteenDaysStr = format(addDays(new Date(), 15), 'yyyy-MM-dd');
  const inTwentyDaysStr = format(addDays(new Date(), 20), 'yyyy-MM-dd');

  // 1. Seed Accounts
  const demoAccounts: Account[] = [
    {
      id: 'acc-checking',
      userId: 'user-1',
      name: 'Checking Account',
      type: 'checking',
      balance: 3450.80,
      currency: 'USD',
      color: '#3B82F6',
      icon: 'wallet',
      isDefault: true,
      createdAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: 'acc-savings',
      userId: 'user-1',
      name: 'Savings Fund',
      type: 'savings',
      balance: 12500.00,
      currency: 'USD',
      color: '#10B981',
      icon: 'cash',
      isDefault: false,
      createdAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: 'acc-credit',
      userId: 'user-1',
      name: 'Prime Visa',
      type: 'credit',
      balance: -412.50,
      currency: 'USD',
      color: '#EF4444',
      icon: 'card',
      isDefault: false,
      createdAt: subDays(new Date(), 30).toISOString(),
    },
    {
      id: 'acc-cash',
      userId: 'user-1',
      name: 'Cash Wallet',
      type: 'cash',
      balance: 180.00,
      currency: 'USD',
      color: '#F59E0B',
      icon: 'wallet',
      isDefault: false,
      createdAt: subDays(new Date(), 30).toISOString(),
    },
  ];
  
  useAccountStore.setState({
    accounts: demoAccounts,
    activeAccountId: 'acc-checking',
  });

  // 2. Seed Budgets
  const demoBudgets: Budget[] = [
    {
      id: 'b-food',
      userId: 'user-1',
      category: 'food',
      limit: 400,
      spent: 240,
      currency: 'USD',
      period: 'monthly',
      startDate: fifteenDaysAgoStr,
      endDate: inFifteenDaysStr,
      color: '#F59E0B',
    },
    {
      id: 'b-entertainment',
      userId: 'user-1',
      category: 'entertainment',
      limit: 150,
      spent: 142,
      currency: 'USD',
      period: 'monthly',
      startDate: fifteenDaysAgoStr,
      endDate: inFifteenDaysStr,
      color: '#8B5CF6',
    },
    {
      id: 'b-transport',
      userId: 'user-1',
      category: 'transport',
      limit: 200,
      spent: 80,
      currency: 'USD',
      period: 'monthly',
      startDate: fifteenDaysAgoStr,
      endDate: inFifteenDaysStr,
      color: '#3B82F6',
    },
    {
      id: 'b-shopping',
      userId: 'user-1',
      category: 'shopping',
      limit: 300,
      spent: 320, // Over budget
      currency: 'USD',
      period: 'monthly',
      startDate: fifteenDaysAgoStr,
      endDate: inFifteenDaysStr,
      color: '#EC4899',
    },
  ];

  useBudgetStore.setState({
    budgets: demoBudgets,
  });

  // 3. Seed Transactions
  const demoTransactions: Transaction[] = [
    {
      id: 't-salary',
      userId: 'user-1',
      type: 'income',
      category: 'salary',
      amount: 4500.00,
      currency: 'USD',
      description: 'Monthly Salary Acme Corp',
      note: 'Direct deposit',
      date: tenDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 10).toISOString(),
      updatedAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: 't-freelance',
      userId: 'user-1',
      type: 'income',
      category: 'freelance',
      amount: 650.00,
      currency: 'USD',
      description: 'UI Design Landing Page',
      note: 'Contract work',
      date: fiveDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 5).toISOString(),
      updatedAt: subDays(new Date(), 5).toISOString(),
    },
    {
      id: 't-rent',
      userId: 'user-1',
      type: 'expense',
      category: 'housing',
      amount: 1250.00,
      currency: 'USD',
      description: 'Apartment Rent',
      note: 'Paid monthly rent',
      date: tenDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 10).toISOString(),
      updatedAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: 't-grocery-1',
      userId: 'user-1',
      type: 'expense',
      category: 'food',
      amount: 145.20,
      currency: 'USD',
      description: 'Whole Foods Market',
      note: 'Weekly groceries',
      date: fiveDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 5).toISOString(),
      updatedAt: subDays(new Date(), 5).toISOString(),
    },
    {
      id: 't-restaurant-1',
      userId: 'user-1',
      type: 'expense',
      category: 'food',
      amount: 94.80,
      currency: 'USD',
      description: 'Sushi Dinner with Friends',
      note: 'Dinner out',
      date: twoDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 2).toISOString(),
      updatedAt: subDays(new Date(), 2).toISOString(),
    },
    {
      id: 't-amazon-1',
      userId: 'user-1',
      type: 'expense',
      category: 'shopping',
      amount: 185.00,
      currency: 'USD',
      description: 'Noise Cancelling Headphones',
      note: 'Amazon purchase',
      date: fiveDaysAgoStr,
      accountId: 'acc-credit',
      source: 'general',
      createdAt: subDays(new Date(), 5).toISOString(),
      updatedAt: subDays(new Date(), 5).toISOString(),
    },
    {
      id: 't-clothing-1',
      userId: 'user-1',
      type: 'expense',
      category: 'shopping',
      amount: 135.00,
      currency: 'USD',
      description: 'Winter Jacket',
      note: 'Zara sale',
      date: yesterdayStr,
      accountId: 'acc-credit',
      source: 'general',
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
    },
    {
      id: 't-gas-1',
      userId: 'user-1',
      type: 'expense',
      category: 'transport',
      amount: 45.00,
      currency: 'USD',
      description: 'Chevron Fuel Station',
      note: 'Car tank refill',
      date: threeDaysAgoStr,
      accountId: 'acc-credit',
      source: 'general',
      createdAt: subDays(new Date(), 3).toISOString(),
      updatedAt: subDays(new Date(), 3).toISOString(),
    },
    {
      id: 't-uber-1',
      userId: 'user-1',
      type: 'expense',
      category: 'transport',
      amount: 35.00,
      currency: 'USD',
      description: 'Uber Ride to Downtown',
      note: 'Night outing ride',
      date: twoDaysAgoStr,
      accountId: 'acc-checking',
      source: 'general',
      createdAt: subDays(new Date(), 2).toISOString(),
      updatedAt: subDays(new Date(), 2).toISOString(),
    },
    {
      id: 't-netflix',
      userId: 'user-1',
      type: 'expense',
      category: 'entertainment',
      amount: 15.49,
      currency: 'USD',
      description: 'Netflix Subscription',
      note: 'Monthly recurring',
      date: fiveDaysAgoStr,
      accountId: 'acc-credit',
      source: 'general',
      createdAt: subDays(new Date(), 5).toISOString(),
      updatedAt: subDays(new Date(), 5).toISOString(),
    },
    {
      id: 't-movies',
      userId: 'user-1',
      type: 'expense',
      category: 'entertainment',
      amount: 42.50,
      currency: 'USD',
      description: 'IMAX Cinema Tickets',
      note: 'Movie night',
      date: yesterdayStr,
      accountId: 'acc-cash',
      source: 'general',
      createdAt: subDays(new Date(), 1).toISOString(),
      updatedAt: subDays(new Date(), 1).toISOString(),
    },
    {
      id: 't-coffee-1',
      userId: 'user-1',
      type: 'expense',
      category: 'food',
      amount: 6.50,
      currency: 'USD',
      description: 'Blue Bottle Cafe',
      note: 'Morning coffee',
      date: todayStr,
      accountId: 'acc-cash',
      source: 'general',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useTransactionStore.setState({
    transactions: demoTransactions,
  });

  // 4. Seed Ledger Entries
  const demoLedgerEntries: LedgerEntry[] = [
    {
      id: 'l-sarah',
      personName: 'Sarah Connor',
      personPhone: '+1 (555) 987-6543',
      personInitials: 'SC',
      personColor: '#6C63FF',
      direction: 'OWED_TO_ME',
      totalAmount: 120.00,
      amountReturned: 40.00,
      currency: 'USD',
      date: fiveDaysAgoStr,
      dueDate: inThreeDaysStr,
      note: 'Airbnb & group dinner splitting',
      status: 'ACTIVE',
      partialReturns: [
        {
          id: 'pr-sarah-1',
          amount: 40.00,
          date: twoDaysAgoStr,
          note: 'Sent via Venmo part 1',
          accountId: 'acc-checking',
        }
      ],
      accountId: 'acc-checking',
    },
    {
      id: 'l-john',
      personName: 'John Doe',
      personPhone: '+1 (555) 123-4567',
      personInitials: 'JD',
      personColor: '#F59E0B',
      direction: 'OWED_TO_ME',
      totalAmount: 80.00,
      amountReturned: 0.00,
      currency: 'USD',
      date: tenDaysAgoStr,
      dueDate: twoDaysAgoStr,
      note: 'Borrowed cash for concert ticket',
      status: 'OVERDUE',
      partialReturns: [],
      accountId: 'acc-cash',
    },
    {
      id: 'l-emma',
      personName: 'Emma Watson',
      personPhone: '+1 (555) 456-7890',
      personInitials: 'EW',
      personColor: '#EC4899',
      direction: 'I_OWE',
      totalAmount: 45.00,
      amountReturned: 0.00,
      currency: 'USD',
      date: twoDaysAgoStr,
      dueDate: inFiveDaysStr,
      note: 'Co-working pass & coffee',
      status: 'ACTIVE',
      partialReturns: [],
      accountId: 'acc-checking',
    },
    {
      id: 'l-mike',
      personName: 'Mike Ross',
      personPhone: '+1 (555) 321-7654',
      personInitials: 'MR',
      personColor: '#10B981',
      direction: 'OWED_TO_ME',
      totalAmount: 50.00,
      amountReturned: 50.00,
      currency: 'USD',
      date: fiveDaysAgoStr,
      dueDate: yesterdayStr,
      note: 'Lunch at Chipotle',
      status: 'SETTLED',
      partialReturns: [
        {
          id: 'pr-mike-1',
          amount: 50.00,
          date: yesterdayStr,
          note: 'Settled full amount',
          accountId: 'acc-checking',
        }
      ],
      accountId: 'acc-checking',
    },
  ];

  useLedgerStore.setState({
    entries: demoLedgerEntries,
  });

  // 5. Seed Planned Payments
  const demoPayments: PlannedPayment[] = [
    {
      id: 'pp-netflix',
      title: 'Netflix Subscription',
      amount: 15.49,
      amountPaid: 0,
      dueDate: inFiveDaysStr,
      category: 'entertainment',
      accountId: 'acc-checking',
      status: 'UPCOMING',
      isRecurring: true,
      recurringInterval: 'monthly',
    },
    {
      id: 'pp-electric',
      title: 'Electricity Bill',
      amount: 112.40,
      amountPaid: 0,
      dueDate: twoDaysAgoStr,
      category: 'housing',
      accountId: 'acc-checking',
      status: 'OVERDUE',
      isRecurring: true,
      recurringInterval: 'monthly',
    },
    {
      id: 'pp-insurance',
      title: 'Auto Insurance',
      amount: 85.00,
      amountPaid: 0,
      dueDate: inOneDayStr,
      category: 'transport',
      accountId: 'acc-checking',
      status: 'UPCOMING',
      isRecurring: true,
      recurringInterval: 'monthly',
    },
    {
      id: 'pp-rent',
      title: 'Apartment Rent',
      amount: 1250.00,
      amountPaid: 1250.00,
      dueDate: yesterdayStr,
      category: 'housing',
      accountId: 'acc-checking',
      status: 'SETTLED',
      isRecurring: true,
      recurringInterval: 'monthly',
      settledAt: yesterdayStr,
    },
  ];

  usePlannedPaymentsStore.setState({
    payments: demoPayments,
  });

  // 6. Seed Loans
  const demoLoans: Loan[] = [
    {
      id: 'loan-car',
      name: 'Car Loan',
      counterparty: 'Chase Auto Finance',
      type: 'BORROWED',
      principalAmount: 18000.00,
      amountPaid: 4500.00,
      interestRate: 4.5,
      startDate: format(subDays(new Date(), 365), 'yyyy-MM-dd'),
      nextPaymentDate: inFiveDaysStr,
      emiAmount: 375.00,
      totalPayments: 48,
      completedPayments: 12,
      color: '#6C63FF',
      remindersEnabled: true,
      reminderTime: '09:00',
      accountId: 'acc-checking',
    },
    {
      id: 'loan-friend',
      name: 'Friend Startup Seed',
      counterparty: 'David Miller',
      type: 'LENT',
      principalAmount: 5000.00,
      amountPaid: 1000.00,
      interestRate: 0,
      startDate: format(subDays(new Date(), 120), 'yyyy-MM-dd'),
      nextPaymentDate: inTwentyDaysStr,
      emiAmount: 250.00,
      totalPayments: 20,
      completedPayments: 4,
      color: '#10B981',
      remindersEnabled: false,
      accountId: 'acc-checking',
    },
  ];

  useLoansStore.setState({
    loans: demoLoans,
  });

  // 7. Seed Notifications (at least 5 mock inbox items & reminders)
  const demoNotifications: AppNotification[] = [
    {
      id: 'notif-1',
      type: 'budget_exceeded',
      title: 'Monthly Budget Exceeded',
      body: 'Your Shopping spending ($320.00) has exceeded your limit of $300.00.',
      isRead: false,
      createdAt: subDays(new Date(), 0).toISOString(),
    },
    {
      id: 'notif-2',
      type: 'budget_warning',
      title: 'Food Budget Warning (80%)',
      body: 'You have spent $240.00 of your $400.00 monthly Food budget.',
      isRead: false,
      createdAt: subDays(new Date(), 1).toISOString(),
    },
    {
      id: 'notif-3',
      type: 'payment_due',
      title: 'Bill Reminder: Auto Insurance',
      body: 'Planned payment of $85.00 is due tomorrow.',
      isRead: true,
      createdAt: subDays(new Date(), 2).toISOString(),
    },
    {
      id: 'notif-4',
      type: 'reminder',
      title: 'Log Daily Expenses',
      body: 'Don\'t forget to log cash payments from today.',
      isRead: true,
      createdAt: subDays(new Date(), 4).toISOString(),
    },
    {
      id: 'notif-5',
      type: 'system',
      title: 'Cloud Backup Successful',
      body: 'All local databases were backed up to secure server.',
      isRead: true,
      createdAt: subDays(new Date(), 5).toISOString(),
    },
  ];

  const demoReminders: NotificationReminder[] = [
    {
      id: 'rem-cash',
      title: 'Log Daily Cash Flow',
      body: 'Record any hand-to-hand transactions from today',
      time: '20:00',
      repeat: 'daily',
      isActive: true,
      expoId: null,
      createdAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: 'rem-audit',
      title: 'Weekly Budget Check',
      body: 'Audit categories, limit status, and spending patterns',
      time: '09:00',
      repeat: 'weekly',
      isActive: true,
      expoId: null,
      createdAt: subDays(new Date(), 10).toISOString(),
    },
    {
      id: 'rem-rent',
      title: 'Bills & Rent Clearance',
      body: 'Check planned payments due dates',
      time: '10:00',
      repeat: 'monthly',
      isActive: false,
      expoId: null,
      createdAt: subDays(new Date(), 10).toISOString(),
    },
  ];

  useNotificationStore.setState({
    notifications: demoNotifications,
    reminders: demoReminders,
  });
}
