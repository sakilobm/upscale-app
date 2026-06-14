import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { RepeatInterval } from '@store/notificationStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('wherecash', {
    name:              'WhereCash',
    importance:        Notifications.AndroidImportance.HIGH,
    vibrationPattern:  [0, 250, 250, 250],
    sound:             'default',
  });
  await Notifications.setNotificationChannelAsync('reminders', {
    name:       'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound:      'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function sendImmediateNotification(
  title: string,
  body:  string,
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true, data: {} },
      trigger: null,
    });
  } catch (_) {}
}

export async function scheduleReminderNotification(
  title:  string,
  body:   string,
  time:   string,
  repeat: RepeatInterval,
): Promise<string | null> {
  try {
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

    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger,
    });
    return id;
  } catch (e) {
    console.warn('scheduleReminder failed:', e);
    return null;
  }
}

export async function cancelScheduledReminder(expoId: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(expoId);
  } catch (_) {}
}
