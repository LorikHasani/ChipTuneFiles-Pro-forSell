import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin';
import { asyncHandler, parsePagination, paginatedResponse, toNumber } from '../utils/helpers';
import { Prisma } from '@prisma/client';
import { sendEmail } from '../services/email';

const router = Router();

// Valid role values
const USER_ROLES = ['CLIENT', 'ADMIN', 'SUPERADMIN'] as const;

// ============================================================================
// DASHBOARD
// ============================================================================

// ---------------------------------------------------------------------------
// GET /dashboard - Admin dashboard stats
// ---------------------------------------------------------------------------
router.get(
  '/dashboard',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalJobs,
      pendingJobs,
      inProgressJobs,
      completedToday,
      totalUsers,
      totalClients,
      totalAdmins,
      revenueResult,
      recentJobs,
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'PENDING' } }),
      prisma.job.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.job.count({
        where: {
          status: 'COMPLETED',
          updatedAt: { gte: todayStart },
        },
      }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CLIENT', isActive: true } }),
      prisma.user.count({
        where: {
          role: { in: ['ADMIN', 'SUPERADMIN'] },
          isActive: true,
        },
      }),
      prisma.transaction.aggregate({
        where: { type: 'CREDIT_PURCHASE' },
        _sum: { amount: true },
      }),
      prisma.job.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
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
      }),
    ]);

    res.json({
      data: {
        totalJobs,
        pendingJobs,
        inProgressJobs,
        completedToday,
        totalUsers,
        totalClients,
        totalAdmins,
        totalRevenue: toNumber(revenueResult._sum.amount),
        recentJobs,
      },
    });
  })
);

// ============================================================================
// USERS
// ============================================================================

// ---------------------------------------------------------------------------
// GET /users - List users
// ---------------------------------------------------------------------------
router.get(
  '/users',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { skip, take, page, limit } = parsePagination(req.query);
    const { search, role } = req.query;

    const where: Prisma.UserWhereInput = {};

    // Search filter
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim();
      where.OR = [
        { email: { contains: term } },
        { contactName: { contains: term } },
        { companyName: { contains: term } },
      ];
    }

    // Role filter
    if (role && (USER_ROLES as readonly string[]).includes(role as string)) {
      where.role = role as string;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          contactName: true,
          companyName: true,
          phone: true,
          country: true,
          creditBalance: true,
          emailNotifications: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { clientJobs: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);

    const shaped = users.map((u) => {
      const { _count, creditBalance, ...rest } = u;
      return {
        ...rest,
        creditBalance: toNumber(creditBalance),
        jobCount: _count.clientJobs,
      };
    });

    res.json(paginatedResponse(shaped, total, page, limit));
  })
);

// ---------------------------------------------------------------------------
// GET /users/:id - Get user detail
// ---------------------------------------------------------------------------
router.get(
  '/users/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        contactName: true,
        companyName: true,
        phone: true,
        country: true,
        creditBalance: true,
        emailNotifications: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const [recentJobs, transactions, spentResult] = await Promise.all([
      prisma.job.findMany({
        where: { clientId: id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          referenceNumber: true,
          brand: true,
          model: true,
          status: true,
          totalPrice: true,
          createdAt: true,
        },
      }),
      prisma.transaction.findMany({
        where: { userId: id },
        take: 20,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transaction.aggregate({
        where: { userId: id, type: 'CREDIT_PURCHASE' },
        _sum: { amount: true },
      }),
    ]);

    res.json({
      data: {
        ...user,
        creditBalance: toNumber(user.creditBalance),
        recentJobs,
        transactions,
        totalSpent: toNumber(spentResult._sum.amount),
      },
    });
  })
);

// ---------------------------------------------------------------------------
// PUT /users/:id - Update user
// ---------------------------------------------------------------------------
router.put(
  '/users/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const currentUser = req.user!;
    const { role, contactName, companyName, phone, country, isActive, emailNotifications } =
      req.body;

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Build update payload with only provided fields
    const data: Prisma.UserUpdateInput = {};

    if (contactName !== undefined) data.contactName = contactName;
    if (companyName !== undefined) data.companyName = companyName;
    if (phone !== undefined) data.phone = phone;
    if (country !== undefined) data.country = country;
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof emailNotifications === 'boolean') data.emailNotifications = emailNotifications;

    // Only superadmins can change roles
    if (role !== undefined) {
      if (currentUser.role !== 'SUPERADMIN') {
        res.status(403).json({ error: 'Only superadmins can change user roles.' });
        return;
      }
      if (!(USER_ROLES as readonly string[]).includes(role)) {
        res.status(400).json({
          error: `Invalid role. Must be one of: ${USER_ROLES.join(', ')}`,
        });
        return;
      }
      data.role = role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        contactName: true,
        companyName: true,
        phone: true,
        country: true,
        creditBalance: true,
        emailNotifications: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      data: {
        ...updated,
        creditBalance: toNumber(updated.creditBalance),
      },
    });
  })
);

// ---------------------------------------------------------------------------
// DELETE /users/:id - Soft-delete user (superadmin only)
// ---------------------------------------------------------------------------
router.delete(
  '/users/:id',
  authenticate,
  requireSuperAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    // Prevent deleting yourself
    if (id === req.user!.id) {
      res.status(400).json({ error: 'You cannot deactivate your own account.' });
      return;
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'User has been deactivated.' });
  })
);

// ---------------------------------------------------------------------------
// POST /users/:id/credits - Adjust user credits
// ---------------------------------------------------------------------------
router.post(
  '/users/:id/credits',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { amount, description } = req.body;
    const adminUser = req.user!;

    if (amount === undefined || typeof amount !== 'number' || amount === 0) {
      res.status(400).json({ error: 'A non-zero numeric amount is required.' });
      return;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true, creditBalance: true },
    });

    if (!targetUser) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const currentBalance = toNumber(targetUser.creditBalance);
    const newBalance = currentBalance + amount;

    if (newBalance < 0) {
      res.status(400).json({ error: 'Adjustment would result in a negative balance.' });
      return;
    }

    // Use a transaction to ensure atomicity
    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({
        where: { id },
        data: { creditBalance: newBalance },
        select: { id: true, email: true, creditBalance: true },
      }),
      prisma.transaction.create({
        data: {
          userId: id,
          type: 'ADMIN_ADJUSTMENT',
          amount: new Prisma.Decimal(amount),
          balanceBefore: new Prisma.Decimal(currentBalance),
          balanceAfter: new Prisma.Decimal(newBalance),
          description: description || `Admin credit adjustment by ${adminUser.email}`,
          processedBy: adminUser.id,
        },
      }),
    ]);

    res.status(201).json({
      data: {
        user: {
          ...updatedUser,
          creditBalance: toNumber(updatedUser.creditBalance),
        },
        transaction,
      },
    });
  })
);

// ============================================================================
// CREDIT PACKAGES
// ============================================================================

// ---------------------------------------------------------------------------
// GET /packages - List all credit packages (including inactive)
// ---------------------------------------------------------------------------
router.get(
  '/packages',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const packages = await prisma.creditPackage.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ data: packages });
  })
);

// ---------------------------------------------------------------------------
// POST /packages - Create a credit package
// ---------------------------------------------------------------------------
router.post(
  '/packages',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, credits, price, bonusCredits, isActive, sortOrder } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'Package name is required.' });
      return;
    }
    if (credits === undefined || typeof credits !== 'number' || credits <= 0) {
      res.status(400).json({ error: 'A positive credits value is required.' });
      return;
    }
    if (price === undefined || typeof price !== 'number' || price <= 0) {
      res.status(400).json({ error: 'A positive price is required.' });
      return;
    }

    const pkg = await prisma.creditPackage.create({
      data: {
        name: name.trim(),
        credits: new Prisma.Decimal(credits),
        price: new Prisma.Decimal(price),
        bonusCredits: bonusCredits !== undefined ? new Prisma.Decimal(bonusCredits) : new Prisma.Decimal(0),
        isActive: typeof isActive === 'boolean' ? isActive : true,
        sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      },
    });

    res.status(201).json({ data: pkg });
  })
);

// ---------------------------------------------------------------------------
// PUT /packages/:id - Update a credit package
// ---------------------------------------------------------------------------
router.put(
  '/packages/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, credits, price, bonusCredits, isActive, sortOrder } = req.body;

    const existing = await prisma.creditPackage.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: 'Credit package not found.' });
      return;
    }

    const data: Prisma.CreditPackageUpdateInput = {};

    if (name !== undefined) data.name = name;
    if (credits !== undefined) data.credits = new Prisma.Decimal(credits);
    if (price !== undefined) data.price = new Prisma.Decimal(price);
    if (bonusCredits !== undefined) data.bonusCredits = new Prisma.Decimal(bonusCredits);
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (typeof sortOrder === 'number') data.sortOrder = sortOrder;

    const updated = await prisma.creditPackage.update({
      where: { id },
      data,
    });

    res.json({ data: updated });
  })
);

// ---------------------------------------------------------------------------
// DELETE /packages/:id - Deactivate a credit package
// ---------------------------------------------------------------------------
router.delete(
  '/packages/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.creditPackage.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: 'Credit package not found.' });
      return;
    }

    await prisma.creditPackage.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Credit package has been deactivated.' });
  })
);

// ============================================================================
// ANNOUNCEMENTS
// ============================================================================

// ---------------------------------------------------------------------------
// GET /announcements/active - List active announcements (public, no auth)
// NOTE: Must come before /announcements/:id to avoid param conflict
// ---------------------------------------------------------------------------
router.get(
  '/announcements/active',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const announcements = await prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ data: announcements });
  })
);

// ---------------------------------------------------------------------------
// GET /announcements - List all announcements (admin only)
// ---------------------------------------------------------------------------
router.get(
  '/announcements',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: {
            id: true,
            email: true,
            contactName: true,
          },
        },
      },
    });

    res.json({ data: announcements });
  })
);

// ---------------------------------------------------------------------------
// POST /announcements - Create an announcement
// ---------------------------------------------------------------------------
router.post(
  '/announcements',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { title, message, type, isActive, imageUrl } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'Title is required.' });
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const validTypes = ['INFO', 'WARNING', 'SUCCESS'];
    const announcementType = type && validTypes.includes(type) ? type : 'INFO';

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        message: message.trim(),
        type: announcementType,
        isActive: typeof isActive === 'boolean' ? isActive : true,
        imageUrl: imageUrl || null,
        createdBy: user.id,
      },
    });

    res.status(201).json({ data: announcement });
  })
);

// ---------------------------------------------------------------------------
// PUT /announcements/:id - Update an announcement
// ---------------------------------------------------------------------------
router.put(
  '/announcements/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, message, type, isActive, imageUrl } = req.body;

    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    const data: Prisma.AnnouncementUpdateInput = {};

    if (title !== undefined) data.title = title;
    if (message !== undefined) data.message = message;
    if (type !== undefined) {
      const validTypes = ['INFO', 'WARNING', 'SUCCESS'];
      if (!validTypes.includes(type)) {
        res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
        return;
      }
      data.type = type;
    }
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (imageUrl !== undefined) data.imageUrl = imageUrl;

    const updated = await prisma.announcement.update({
      where: { id },
      data,
    });

    res.json({ data: updated });
  })
);

// ---------------------------------------------------------------------------
// DELETE /announcements/:id - Delete an announcement
// ---------------------------------------------------------------------------
router.delete(
  '/announcements/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const existing = await prisma.announcement.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: 'Announcement not found.' });
      return;
    }

    await prisma.announcement.delete({ where: { id } });

    res.json({ message: 'Announcement deleted.' });
  })
);

// ============================================================================
// EMAILS
// ============================================================================

// ---------------------------------------------------------------------------
// POST /emails/send - Send bulk email to selected users
// ---------------------------------------------------------------------------
router.post(
  '/emails/send',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientIds, subject, message, colorTheme } = req.body;

    if (!recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      res.status(400).json({ error: 'At least one recipient is required.' });
      return;
    }
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      res.status(400).json({ error: 'Subject is required.' });
      return;
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'Message is required.' });
      return;
    }

    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds }, isActive: true },
      select: { id: true, email: true, contactName: true },
    });

    if (users.length === 0) {
      res.status(400).json({ error: 'No valid recipients found.' });
      return;
    }

    const themeColor = colorTheme === 'red' ? '#dc2626' : '#3b82f6';

    // Build HTML from the message (convert newlines to <br>)
    const htmlMessage = message.trim().replace(/\n/g, '<br>');
    const emailHtml = `
      <div style="border-top: 4px solid ${themeColor}; padding-top: 16px;">
        ${htmlMessage}
      </div>
    `;

    let successCount = 0;
    let failCount = 0;

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const ok = await sendEmail(user.email, subject.trim(), emailHtml);
        if (ok) successCount++;
        else failCount++;
      })
    );

    res.json({
      data: {
        total: users.length,
        success: successCount,
        failed: failCount,
      },
    });
  })
);

export default router;
