// ==========================================================================
// JARVIS v4.0 — In-app notification service (toast queue)
// ==========================================================================

import type { Notification } from '../types';

type Listener = (notifications: Notification[]) => void;

let notifications: Notification[] = [];
const listeners = new Set<Listener>();
const MAX_CONCURRENT = 5;

function notify() {
  for (const listener of listeners) {
    listener([...notifications]);
  }
}

/**
 * Add a new notification to the queue.
 * Auto-removes after `duration` ms (default 5000).
 * Deduplicates by title+message.
 */
export function addNotification(
  n: Omit<Notification, 'id'>,
): string {
  // Deduplicate
  const dup = notifications.find(
    (existing) => existing.title === n.title && existing.message === n.message,
  );
  if (dup) return dup.id;

  const id = crypto.randomUUID();
  const notification: Notification = { ...n, id };

  notifications = [...notifications, notification].slice(-MAX_CONCURRENT);
  notify();

  // Auto-remove after duration
  const duration = n.duration > 0 ? n.duration : 5000;
  setTimeout(() => {
    dismissNotification(id);
  }, duration);

  return id;
}

/**
 * Remove a notification by ID.
 */
export function dismissNotification(id: string): void {
  notifications = notifications.filter((n) => n.id !== id);
  notify();
}

/**
 * Clear all notifications.
 */
export function clearAllNotifications(): void {
  notifications = [];
  notify();
}

/**
 * Subscribe to notification changes.
 * Returns an unsubscribe function.
 */
export function subscribeToNotifications(
  listener: Listener,
): () => void {
  listeners.add(listener);
  // Immediately call with current state
  listener([...notifications]);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get current notifications (snapshot).
 */
export function getNotifications(): Notification[] {
  return [...notifications];
}
