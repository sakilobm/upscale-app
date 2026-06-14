import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { zustandStorage } from './storage';

export type NotificationType = 'budget_exceeded' | 'budget_warning' | 'payment_due' | 'reminder' | 'system';
export type RepeatInterval   = 'none' | 'daily' | 'weekly' | 'monthly';

export interface AppNotification {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  isRead:    boolean;
  createdAt: string;
}

export interface NotificationReminder {
  id:        string;
  title:     string;
  body:      string;
  time:      string; // "HH:MM" 24-hour
  repeat:    RepeatInterval;
  isActive:  boolean;
  expoId:    string | null;
  createdAt: string;
}

export interface NotificationSettings {
  budgetExceeded:   boolean;
  budgetWarning:    boolean;
  paymentDue:       boolean;
  remindersEnabled: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  reminders:     NotificationReminder[];
  settings:      NotificationSettings;
  hasPermission: boolean;

  addNotification:  (n: Omit<AppNotification, 'id' | 'isRead' | 'createdAt'>) => void;
  markRead:         (id: string) => void;
  markAllRead:      () => void;
  deleteNotification:(id: string) => void;
  clearAll:         () => void;

  addReminder:    (r: Omit<NotificationReminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, updates: Partial<NotificationReminder>) => void;
  deleteReminder: (id: string) => void;

  updateSettings: (s: Partial<NotificationSettings>) => void;
  setPermission:  (granted: boolean) => void;
  reset:          () => void;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  budgetExceeded:   true,
  budgetWarning:    true,
  paymentDue:       true,
  remindersEnabled: true,
};

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: [],
      reminders:     [],
      settings:      DEFAULT_SETTINGS,
      hasPermission: false,

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            {
              ...n,
              id:        `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              isRead:    false,
              createdAt: new Date().toISOString(),
            },
            ...state.notifications,
          ].slice(0, 100),
        })),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        })),

      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearAll: () => set({ notifications: [] }),

      addReminder: (r) =>
        set((state) => ({
          reminders: [
            ...state.reminders,
            {
              ...r,
              id:        `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      updateReminder: (id, updates) =>
        set((state) => ({
          reminders: state.reminders.map((r) =>
            r.id === id ? { ...r, ...updates } : r,
          ),
        })),

      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),

      updateSettings: (s) =>
        set((state) => ({ settings: { ...state.settings, ...s } })),

      setPermission: (hasPermission) => set({ hasPermission }),

      reset: () =>
        set({ notifications: [], reminders: [], settings: DEFAULT_SETTINGS, hasPermission: false }),
    }),
    {
      name:       'wc-notifications',
      storage:    zustandStorage,
      partialize: (s) => ({
        notifications: s.notifications,
        reminders:     s.reminders,
        settings:      s.settings,
        hasPermission: s.hasPermission,
      }),
    },
  ),
);
