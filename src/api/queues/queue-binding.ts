import { env } from 'cloudflare:workers';
import type { NotificationJob } from './notification-messages';

type QueueEnv = { NOTIFICATIONS_QUEUE?: Queue<NotificationJob> };

export function getNotificationsQueue(): Queue<NotificationJob> | null {
  return (env as QueueEnv).NOTIFICATIONS_QUEUE ?? null;
}
