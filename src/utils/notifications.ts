import AsyncStorage from '@react-native-async-storage/async-storage';

// Import lazy para evitar el warning de Expo Go
let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch {
      console.log('📵 Notificaciones no disponibles en Expo Go');
      return null;
    }
  }
  return Notifications;
}

// ─── Notification handler (call once at app start) ───────────────────────────

/**
 * Sets the global notification handler. Call this in app/_layout.tsx.
 */
export async function setupNotificationHandler(): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;

  notifs.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// ─── Permission request ───────────────────────────────────────────────────────

/**
 * Requests notification permissions. Returns true if granted.
 */
export async function requestPermissions(): Promise<boolean> {
  const notifs = await getNotifications();
  if (!notifs) return false;

  try {
    const { status: existing } = await notifs.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await notifs.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── AsyncStorage key helpers ─────────────────────────────────────────────────

function storageKey(habitId: number): string {
  return `reminder_${habitId}`;
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

/**
 * Schedules a daily repeating notification for a habit.
 * `time` must be "HH:MM" (24h format).
 * Returns the notification identifier, or null if permission was denied.
 * Stores the identifier in AsyncStorage under `reminder_${habitId}`.
 */
export async function scheduleHabitReminder(
  habitId: number,
  habitName: string,
  time: string
): Promise<string | null> {
  const granted = await requestPermissions();
  if (!granted) return null;

  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  const notifs = await getNotifications();
  if (!notifs) return null;

  const identifier = await notifs.scheduleNotificationAsync({
    content: {
      title: habitName,
      body: '¡Es hora de tu hábito!',
    },
    trigger: {
      type: notifs.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  await AsyncStorage.setItem(storageKey(habitId), identifier);
  return identifier;
}

// ─── Cancel ──────────────────────────────────────────────────────────────────

/**
 * Cancels a scheduled notification by its identifier string.
 */
export async function cancelHabitReminder(identifier: string): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  await notifs.cancelScheduledNotificationAsync(identifier);
}

/**
 * Cancels the scheduled notification for a habit by habitId.
 * Reads the identifier from AsyncStorage, then removes it.
 */
export async function cancelHabitReminderById(habitId: number): Promise<void> {
  const key = storageKey(habitId);
  const identifier = await AsyncStorage.getItem(key);
  if (identifier) {
    await cancelHabitReminder(identifier);
    await AsyncStorage.removeItem(key);
  }
}

/**
 * Reschedules the notification for a habit (cancel old + schedule new).
 * Use this when a habit's reminderTime changes.
 */
export async function rescheduleHabitReminder(
  habitId: number,
  habitName: string,
  newTime: string | null
): Promise<string | null> {
  await cancelHabitReminderById(habitId);
  if (!newTime) return null;
  return scheduleHabitReminder(habitId, habitName, newTime);
}

export async function cancelAllReminders(): Promise<void> {
  const notifs = await getNotifications();
  if (!notifs) return;
  await notifs.cancelAllScheduledNotificationsAsync();
}
