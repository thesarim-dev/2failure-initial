import { supabase } from './supabase';
import { storageKeyFor } from './persistedSettings';
import { track } from './analytics';

/**
 * "Protect your flame" reminders: browser push notifications sent by a
 * scheduled Supabase function in the evening, only on days the player hasn't
 * trained. This file handles permission, the push subscription and saving it.
 * Sending needs VITE_VAPID_PUBLIC_KEY here and the server function deployed.
 */

export type ReminderSupport = 'ok' | 'ios-needs-install' | 'unsupported';

function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document);
}

function isStandalone(): boolean {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function reminderSupport(): ReminderSupport {
  if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
    // iPhone Safari only exposes notifications to apps added to the home screen.
    return typeof window !== 'undefined' && isIOS() && !isStandalone() ? 'ios-needs-install' : 'unsupported';
  }
  if (isIOS() && !isStandalone()) return 'ios-needs-install';
  return 'ok';
}

export function reminderPermission(): NotificationPermission | 'unsupported' {
  return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported';
}

/** Whether we've already shown the soft "protect your flame" ask on this device. */
export function hasAskedForReminders(userId: string | undefined): boolean {
  if (!userId) return true;
  try {
    return !!window.localStorage.getItem(storageKeyFor(userId, 'reminder-ask'));
  } catch {
    return true;
  }
}
export function markAskedForReminders(userId: string | undefined, answer: 'yes' | 'later' | 'ios'): void {
  if (!userId) return;
  try {
    window.localStorage.setItem(storageKeyFor(userId, 'reminder-ask'), answer);
  } catch {
    // Ignore storage failures.
  }
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Ask the browser for permission, then subscribe and save it. Returns the outcome. */
export async function enableReminders(userId: string, language: string): Promise<'granted' | 'denied' | 'error'> {
  try {
    const permission = await Notification.requestPermission();
    track('reminders_permission', { result: permission });
    if (permission !== 'granted') return 'denied';
    const vapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
    if (!vapid) return 'granted'; // Permission saved; sending turns on once the server is set up.
    const registration = await navigator.serviceWorker.ready;
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource }));
    const json = subscription.toJSON();
    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        endpoint: subscription.endpoint,
        user_id: userId,
        p256dh: json.keys?.p256dh ?? '',
        auth: json.keys?.auth ?? '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language
      },
      { onConflict: 'endpoint' }
    );
    if (error) throw error;
    return 'granted';
  } catch {
    return 'error';
  }
}

export async function disableReminders(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
      await subscription.unsubscribe();
    }
    track('reminders_off');
  } catch {
    // Ignore: worst case the server drops it when the push bounces.
  }
}

/** Whether this device currently has an active push subscription. */
export async function remindersActive(): Promise<boolean> {
  try {
    if (reminderPermission() !== 'granted') return false;
    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return true;
    const registration = await navigator.serviceWorker.ready;
    return !!(await registration.pushManager.getSubscription());
  } catch {
    return false;
  }
}
