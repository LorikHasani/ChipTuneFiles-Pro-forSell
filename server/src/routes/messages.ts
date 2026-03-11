import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// ---------------------------------------------------------------------------
// GET /job/:jobId - Get messages for a job
// ---------------------------------------------------------------------------
router.get(
  '/job/:jobId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, clientId: true },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    // Clients can only view their own job messages
    if (!isAdmin && job.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const messages = await prisma.jobMessage.findMany({
      where: {
        jobId,
        // Clients cannot see internal messages
        ...(isAdmin ? {} : { isInternal: false }),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            contactName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: messages });
  })
);

// ---------------------------------------------------------------------------
// POST /job/:jobId - Send a message on a job
// ---------------------------------------------------------------------------
router.post(
  '/job/:jobId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const { message, isInternal } = req.body;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    // Verify job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, clientId: true },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    // Clients can only send messages on their own jobs
    if (!isAdmin && job.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // Only admins can set isInternal
    const internalFlag = isAdmin && isInternal === true;

    const created = await prisma.jobMessage.create({
      data: {
        jobId,
        senderId: user.id,
        message: message.trim(),
        isInternal: internalFlag,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            contactName: true,
            role: true,
          },
        },
      },
    });

    res.status(201).json({ data: created });
  })
);

// ---------------------------------------------------------------------------
// PUT /job/:messageId/read - Mark a job message as read
// ---------------------------------------------------------------------------
router.put(
  '/job/:messageId/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const user = req.user!;

    const message = await prisma.jobMessage.findUnique({
      where: { id: messageId },
      include: {
        job: { select: { clientId: true } },
      },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Only the job owner or an admin can mark messages as read
    if (!isAdmin && message.job.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const updated = await prisma.jobMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    res.json({ data: updated });
  })
);

// ---------------------------------------------------------------------------
// GET /ticket/:ticketId - Get messages for a ticket
// ---------------------------------------------------------------------------
router.get(
  '/ticket/:ticketId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ticketId } = req.params;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, clientId: true },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    // Clients can only view their own ticket messages
    if (!isAdmin && ticket.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const messages = await prisma.ticketMessage.findMany({
      where: { ticketId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            contactName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ data: messages });
  })
);

// ---------------------------------------------------------------------------
// POST /ticket/:ticketId - Send a message on a ticket
// ---------------------------------------------------------------------------
router.post(
  '/ticket/:ticketId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ticketId } = req.params;
    const { message } = req.body;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { id: true, clientId: true },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    // Clients can only send messages on their own tickets
    if (!isAdmin && ticket.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    const created = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            contactName: true,
            role: true,
          },
        },
      },
    });

    // Update the ticket's updatedAt timestamp
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() },
    });

    res.status(201).json({ data: created });
  })
);

export default router;
