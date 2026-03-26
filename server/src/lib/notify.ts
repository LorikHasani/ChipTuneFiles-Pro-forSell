import { prisma } from './prisma';

/**
 * Create a notification for a user.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function notify(
  userId: string,
  title: string,
  message: string,
  linkType?: 'JOB' | 'TICKET' | 'CREDIT',
  linkId?: string,
) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, linkType, linkId },
    });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
