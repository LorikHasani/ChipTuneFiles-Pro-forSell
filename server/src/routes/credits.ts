import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  createCheckoutSession,
  verifyWebhookSignature,
  getCheckoutSession,
} from '../services/stripe';
import { sendCreditConfirmation } from '../services/email';
import { notify } from '../lib/notify';
import { asyncHandler, parsePagination, paginatedResponse } from '../utils/helpers';

const router = Router();

// ============================================
// GET /packages - List active credit packages (public)
// ============================================
router.get(
  '/packages',
  asyncHandler(async (_req: Request, res: Response) => {
    const packages = await prisma.creditPackage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ data: packages });
  })
);

// ============================================
// POST /checkout - Create Stripe checkout session
// ============================================
router.post(
  '/checkout',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { packageId, customCredits } = req.body;

    if (!packageId && customCredits === undefined) {
      res.status(400).json({
        error: 'Either packageId or customCredits is required.',
      });
      return;
    }

    if (packageId && customCredits !== undefined) {
      res.status(400).json({
        error: 'Provide either packageId or customCredits, not both.',
      });
      return;
    }

    let credits: number;
    let bonusCredits: number;
    let priceInCents: number;
    let packageName: string;
    let resolvedPackageId: string;

    if (packageId) {
      // Look up package details
      const creditPackage = await prisma.creditPackage.findUnique({
        where: { id: packageId },
      });

      if (!creditPackage) {
        res.status(404).json({ error: 'Credit package not found.' });
        return;
      }

      if (!creditPackage.isActive) {
        res.status(400).json({ error: 'This credit package is no longer available.' });
        return;
      }

      credits = Number(creditPackage.credits);
      bonusCredits = Number(creditPackage.bonusCredits);
      priceInCents = Math.round(Number(creditPackage.price) * 100);
      packageName = creditPackage.name;
      resolvedPackageId = creditPackage.id;
    } else {
      // Custom credits purchase
      const amount = Number(customCredits);

      if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
        res.status(400).json({ error: 'customCredits must be a whole number.' });
        return;
      }

      if (amount < 10) {
        res.status(400).json({ error: 'Minimum custom credit purchase is 10.' });
        return;
      }

      if (amount > 10000) {
        res.status(400).json({ error: 'Maximum custom credit purchase is 10,000.' });
        return;
      }

      credits = amount;
      bonusCredits = 0;
      priceInCents = amount * 100; // 1:1 EUR
      packageName = `${amount} Credits (Custom)`;
      resolvedPackageId = 'custom';
    }

    // Fetch user to get stripe customer ID
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, email: true },
    });

    const session = await createCheckoutSession({
      userId: user.id,
      userEmail: dbUser?.email || user.email,
      packageId: resolvedPackageId,
      packageName,
      credits,
      bonusCredits,
      priceInCents,
      stripeCustomerId: dbUser?.stripeCustomerId || undefined,
    });

    res.json({
      sessionId: session.id,
      url: session.url,
    });
  })
);

// ============================================
// POST /webhook - Stripe webhook handler (NO auth)
// ============================================
router.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing stripe-signature header.' });
      return;
    }

    let event;
    try {
      event = verifyWebhookSignature(req.body, signature);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).json({ error: 'Invalid webhook signature.' });
      return;
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata;

      if (!metadata?.userId || !metadata?.credits) {
        console.error('Webhook missing required metadata:', metadata);
        res.status(400).json({ error: 'Missing required metadata.' });
        return;
      }

      const userId = metadata.userId;
      const credits = Number(metadata.credits);
      const bonusCredits = Number(metadata.bonusCredits || 0);
      const totalCredits = credits + bonusCredits;

      // Process the credit addition in a transaction
      await prisma.$transaction(async (tx) => {
        // Get current user balance
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: {
            creditBalance: true,
            email: true,
            contactName: true,
          },
        });

        if (!user) {
          throw new Error(`User not found: ${userId}`);
        }

        const balanceBefore = Number(user.creditBalance);
        const balanceAfter = balanceBefore + totalCredits;

        // Update user balance
        await tx.user.update({
          where: { id: userId },
          data: { creditBalance: balanceAfter },
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            userId,
            type: 'CREDIT_PURCHASE',
            amount: totalCredits,
            balanceBefore,
            balanceAfter,
            description: bonusCredits > 0
              ? `Purchased ${credits} credits + ${bonusCredits} bonus credits`
              : `Purchased ${credits} credits`,
            stripeSessionId: session.id,
          },
        });

        // Notify user about the purchase
        notify(
          userId,
          `Credits purchased: +${totalCredits}`,
          bonusCredits > 0
            ? `You received ${credits} credits + ${bonusCredits} bonus credits. New balance: ${balanceAfter}.`
            : `You received ${credits} credits. New balance: ${balanceAfter}.`,
          'CREDIT',
        );

        // Send confirmation email (non-blocking)
        const pricePaid = (session.amount_total || 0) / 100;
        sendCreditConfirmation(
          user.email,
          user.contactName || '',
          credits,
          bonusCredits,
          pricePaid,
          balanceAfter
        ).catch((err) =>
          console.error('Failed to send credit confirmation email:', err)
        );
      });
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
  })
);

// ============================================
// GET /verify/:sessionId - Verify Stripe session
// ============================================
router.get(
  '/verify/:sessionId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { sessionId } = req.params;

    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required.' });
      return;
    }

    try {
      const session = await getCheckoutSession(sessionId);

      res.json({
        status: session.status,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        metadata: session.metadata,
      });
    } catch (err: any) {
      res.status(404).json({ error: 'Checkout session not found.' });
      return;
    }
  })
);

// ============================================
// GET /transactions - User's transaction history
// ============================================
router.get(
  '/transactions',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = req.user!;
    const { skip, take, page, limit } = parsePagination(req.query);

    const isAdmin =
      user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Build where clause
    const where: Record<string, any> = {};

    if (!isAdmin) {
      // Clients can only see their own transactions
      where.userId = user.id;
    } else if (req.query.userId) {
      // Admins can filter by userId
      where.userId = req.query.userId as string;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          job: {
            select: {
              id: true,
              referenceNumber: true,
              brand: true,
              model: true,
            },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json(paginatedResponse(transactions, total, page, limit));
  })
);

// ============================================
// POST /adjust - Admin credit adjustment
// ============================================
router.post(
  '/adjust',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const adminUser = req.user!;
    const { userId, amount, description } = req.body;

    // Validate inputs
    if (!userId) {
      res.status(400).json({ error: 'userId is required.' });
      return;
    }

    if (amount === undefined || amount === null) {
      res.status(400).json({ error: 'amount is required.' });
      return;
    }

    const adjustmentAmount = Number(amount);
    if (!Number.isFinite(adjustmentAmount) || adjustmentAmount === 0) {
      res.status(400).json({
        error: 'amount must be a non-zero number.',
      });
      return;
    }

    if (!description || typeof description !== 'string' || !description.trim()) {
      res.status(400).json({ error: 'description is required.' });
      return;
    }

    // Process within a transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      const targetUser = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, creditBalance: true },
      });

      if (!targetUser) {
        throw new Error('USER_NOT_FOUND');
      }

      const balanceBefore = Number(targetUser.creditBalance);
      const balanceAfter = balanceBefore + adjustmentAmount;

      // Prevent negative balance
      if (balanceAfter < 0) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { creditBalance: balanceAfter },
        select: { id: true, creditBalance: true, email: true, contactName: true },
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          type: 'ADMIN_ADJUSTMENT',
          amount: adjustmentAmount,
          balanceBefore,
          balanceAfter,
          description: description.trim(),
          processedBy: adminUser.id,
        },
      });

      return { updatedUser, transaction };
    }).catch((err) => {
      if (err.message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: 'User not found.' });
        return null;
      }
      if (err.message === 'INSUFFICIENT_BALANCE') {
        res.status(400).json({
          error: 'Adjustment would result in a negative balance.',
        });
        return null;
      }
      throw err;
    });

    // If error was handled above, result is null
    if (!result) return;

    // Notify the user
    const sign = adjustmentAmount > 0 ? '+' : '';
    notify(
      userId,
      `Credits ${adjustmentAmount > 0 ? 'added' : 'deducted'}: ${sign}${adjustmentAmount}`,
      `${description.trim()}. New balance: ${Number(result.updatedUser.creditBalance)}.`,
      'CREDIT',
    );

    res.json({
      message: 'Credit adjustment applied successfully.',
      userId: result.updatedUser.id,
      newBalance: Number(result.updatedUser.creditBalance),
      transaction: {
        id: result.transaction.id,
        type: result.transaction.type,
        amount: Number(result.transaction.amount),
        balanceBefore: Number(result.transaction.balanceBefore),
        balanceAfter: Number(result.transaction.balanceAfter),
        description: result.transaction.description,
        createdAt: result.transaction.createdAt,
      },
    });
  })
);

export default router;
