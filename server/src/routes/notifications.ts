import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, parsePagination, paginatedResponse } from '../utils/helpers';

const router = Router();

// ---------------------------------------------------------------------------
// GET / - List notifications for the current user
// ---------------------------------------------------------------------------
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { skip, take, page, limit } = parsePagination(req.query);

    const where = { userId: user.id };

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    res.json({
      ...paginatedResponse(notifications, total, page, limit),
      unreadCount,
    });
  })
);

// ---------------------------------------------------------------------------
// GET /unread-count - Get unread notification count for the current user
// ---------------------------------------------------------------------------
router.get(
  '/unread-count',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const count = await prisma.notification.count({
      where: { userId: user.id, isRead: false },
    });
    res.json({ count });
  })
);

// ---------------------------------------------------------------------------
// PUT /read-all - Mark all notifications as read
// NOTE: This route must come BEFORE /:id/read to avoid param conflicts
// ---------------------------------------------------------------------------
router.put(
  '/read-all',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;

    const result = await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });

    res.json({ data: { updatedCount: result.count } });
  })
);

// ---------------------------------------------------------------------------
// PUT /:id/read - Mark a single notification as read
// ---------------------------------------------------------------------------
router.put(
  '/:id/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    if (notification.userId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({ data: updated });
  })
);

// ---------------------------------------------------------------------------
// DELETE /:id - Delete a notification
// ---------------------------------------------------------------------------
router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found.' });
      return;
    }

    if (notification.userId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification deleted.' });
  })
);

// ---------------------------------------------------------------------------
// POST / - Create a notification (admin only, or internal use)
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!isAdmin) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const { userId, title, message, linkType, linkId } = req.body;

    if (!userId || !title || !message) {
      res.status(400).json({ error: 'userId, title and message are required.' });
      return;
    }

    const notification = await prisma.notification.create({
      data: { userId, title, message, linkType, linkId },
    });

    res.status(201).json({ data: notification });
  })
);

export default router;
