import type { NotificationJob } from './notification-messages';
import { getNotificationsQueue } from './queue-binding';

/** Encola trabajo async; devuelve false si no hay cola (fallback síncrono en caller). */
export async function enqueueNotification(job: NotificationJob): Promise<boolean> {
  const queue = getNotificationsQueue();
  if (!queue) return false;
  try {
    await queue.send(job);
    return true;
  } catch (err) {
    console.error('Error encolando notificación:', err);
    return false;
  }
}
