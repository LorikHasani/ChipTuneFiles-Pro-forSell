import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/helpers';
import { notify } from '../lib/notify';

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

    // Notify the other party about the new message (skip internal notes)
    if (!internalFlag) {
      if (isAdmin) {
        // Admin sent a message → notify the client
        notify(
          job.clientId,
          'New message on your job',
          message.trim().slice(0, 200),
          'JOB',
          jobId,
        );
      } else {
        // Client sent a message → notify assigned admin (if any)
        const fullJob = await prisma.job.findUnique({
          where: { id: jobId },
          select: { assignedAdminId: true, referenceNumber: true },
        });
        if (fullJob?.assignedAdminId) {
          notify(
            fullJob.assignedAdminId,
            `New message — ${fullJob.referenceNumber}`,
            message.trim().slice(0, 200),
            'JOB',
            jobId,
          );
        }
      }
    }

    res.status(201).json({ data: created });
  })
);

// ---------------------------------------------------------------------------
// PUT /job/:jobId/read - Mark ALL unread messages for a job as read (batch)
// ---------------------------------------------------------------------------
router.put(
  '/job/:jobId/read',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Verify job exists and user has access
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, clientId: true },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    if (!isAdmin && job.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // Mark all unread messages in this job as read (only messages from others)
    const result = await prisma.jobMessage.updateMany({
      where: {
        jobId,
        isRead: false,
        senderId: { not: user.id },
        ...(isAdmin ? {} : { isInternal: false }),
      },
      data: { isRead: true },
    });

    res.json({ data: { updatedCount: result.count } });
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

    // Notify the other party
    if (isAdmin) {
      // Admin replied → notify client
      notify(
        ticket.clientId,
        'New reply on your ticket',
        message.trim().slice(0, 200),
        'TICKET',
        ticketId,
      );
    }
    // Note: when client sends a ticket message, admins see it in their ticket queue

    res.status(201).json({ data: created });
  })
);

export default router;
