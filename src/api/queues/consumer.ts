import { logger } from '../utils/logger';
import type { NotificationJob } from './notification-messages';
import { processNotificationJob } from './processor';

export async function handleNotificationQueueBatch(
  batch: MessageBatch<NotificationJob>
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await processNotificationJob(message.body);
      message.ack();
    } catch (err) {
      logger.error({
        event: 'notification_queue_message_failed',
        message: String(err),
        id: message.id,
      });
      message.retry();
    }
  }
}
