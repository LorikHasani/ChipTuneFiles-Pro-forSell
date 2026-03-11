import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler, parsePagination, paginatedResponse } from '../utils/helpers';

const router = Router();

// Valid ticket statuses
const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;

// ---------------------------------------------------------------------------
// GET / - List tickets
// ---------------------------------------------------------------------------
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
    const { skip, take, page, limit } = parsePagination(req.query);
    const { status } = req.query;

    const where: any = {};

    if (!isAdmin) {
      // Clients only see their own tickets
      where.clientId = user.id;
    } else if (status && (TICKET_STATUSES as readonly string[]).includes(status as string)) {
      // Admins can filter by status
      where.status = status as string;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
              contactName: true,
              companyName: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              message: true,
              createdAt: true,
              senderId: true,
            },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.ticket.count({ where }),
    ]);

    // Reshape to include messageCount and lastMessage at top level
    const shaped = tickets.map((ticket) => {
      const { messages, _count, ...rest } = ticket;
      return {
        ...rest,
        messageCount: _count.messages,
        lastMessage: messages[0] || null,
      };
    });

    res.json(paginatedResponse(shaped, total, page, limit));
  })
);

// ---------------------------------------------------------------------------
// POST / - Create a ticket
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { subject, message } = req.body;

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ error: 'Subject is required.' });
      return;
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        clientId: user.id,
        subject: subject.trim(),
        messages: {
          create: {
            senderId: user.id,
            message: message.trim(),
          },
        },
      },
      include: {
        messages: {
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
        },
        client: {
          select: {
            id: true,
            email: true,
            contactName: true,
            companyName: true,
          },
        },
      },
    });

    res.status(201).json({ data: ticket });
  })
);

// ---------------------------------------------------------------------------
// GET /:id - Get ticket detail
// ---------------------------------------------------------------------------
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            contactName: true,
            companyName: true,
          },
        },
        messages: {
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
        },
      },
    });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    // Clients can only view their own tickets
    if (!isAdmin && ticket.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    res.json({ data: ticket });
  })
);

// ---------------------------------------------------------------------------
// PUT /:id/status - Update ticket status (admin only)
// ---------------------------------------------------------------------------
router.put(
  '/:id/status',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !(TICKET_STATUSES as readonly string[]).includes(status)) {
      res.status(400).json({
        error: `Invalid status. Must be one of: ${TICKET_STATUSES.join(', ')}`,
      });
      return;
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      res.status(404).json({ error: 'Ticket not found.' });
      return;
    }

    const updated = await prisma.ticket.update({
      where: { id },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            contactName: true,
            companyName: true,
          },
        },
      },
    });

    res.json({ data: updated });
  })
);

export default router;
