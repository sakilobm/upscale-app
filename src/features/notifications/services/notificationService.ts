import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { RepeatInterval } from '@store/notificationStore';

// Expo Go (SDK 53+) crashes when expo-notifications is imported because
// DevicePushTokenAutoRegistration.fx.js registers a push listener that
// throws immediately in the Expo Go environment.
// We detect Expo Go via executionEnvironment and skip ALL imports of
// expo-notifications, so the module is never evaluated there.
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

type Listener = { remove: () => void };

async function N() {
  if (IS_EXPO_GO) return null;
  return import('expo-notifications');
}

export async function setupNotificationChannel(): Promise<void> {
  const Notifications = await N();
  if (!Notifications) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  true,
      shouldSetBadge:   false,
    }),
  });

  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('wherecash', {
    name:             'WhereCash',
    importance:       Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound:            'default',
  });
  await Notifications.setNotificationChannelAsync('reminders', {
    name:       'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await N();
  if (!Notifications) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function startListening(
  onReceived: (title: string, body: string) => void,
): Promise<Listener | null> {
  const Notifications = await N();
  if (!Notifications) return null;

  return Notifications.addNotificationReceivedListener((n) => {
    onReceived(
      n.request.content.title ?? 'Reminder',
      n.request.content.body  ?? '',
    );
  });
}

export async function sendImmediateNotification(
  title: string,
  body:  string,
): Promise<void> {
  const Notifications = await N();
  if (!Notifications) return;

  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true, data: {} },
    trigger: null,
  });
}

export async function scheduleReminderNotification(
  title:  string,
  body:   string,
  time:   string,
  repeat: RepeatInterval,
): Promise<string | null> {
  const Notifications = await N();
  if (!Notifications) return null;

  const [hour, minute] = time.split(':').map(Number);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let trigger: any;
  if (repeat === 'daily') {
    trigger = { hour, minute, repeats: true };
  } else if (repeat === 'weekly') {
    trigger = { weekday: new Date().getDay() + 1, hour, minute, repeats: true };
  } else {
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    if (d <= new Date()) d.setDate(d.getDate() + 1);
    trigger = { date: d };
  }

  return Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger,
  });
}

export async function cancelScheduledReminder(expoId: string): Promise<void> {
  const Notifications = await N();
  if (!Notifications) return;

  await Notifications.cancelScheduledNotificationAsync(expoId);
}
