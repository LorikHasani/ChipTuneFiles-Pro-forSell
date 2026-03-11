import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../utils/helpers';

const router = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or fewer')
    .transform((v) => v.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer'),
  contactName: z
    .string()
    .min(1, 'Contact name is required')
    .max(100, 'Contact name must be 100 characters or fewer')
    .trim(),
  companyName: z
    .string()
    .max(150, 'Company name must be 150 characters or fewer')
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(30, 'Phone must be 30 characters or fewer')
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'Country must be 100 characters or fewer')
    .trim()
    .optional()
    .nullable(),
});

const loginSchema = z.object({
  email: z
    .string()
    .email('Invalid email address')
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});

const updateProfileSchema = z.object({
  contactName: z
    .string()
    .min(1, 'Contact name is required')
    .max(100, 'Contact name must be 100 characters or fewer')
    .trim()
    .optional(),
  companyName: z
    .string()
    .max(150, 'Company name must be 150 characters or fewer')
    .trim()
    .optional()
    .nullable(),
  phone: z
    .string()
    .max(30, 'Phone must be 30 characters or fewer')
    .trim()
    .optional()
    .nullable(),
  country: z
    .string()
    .max(100, 'Country must be 100 characters or fewer')
    .trim()
    .optional()
    .nullable(),
  emailNotifications: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be 128 characters or fewer')
    .optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
}

function signToken(payload: { userId: string; email: string; role: string }): string {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

/**
 * Strips passwordHash from a user record and converts Decimal creditBalance
 * to a plain number for JSON serialisation.
 */
function sanitizeUser(user: Record<string, any>) {
  const { passwordHash, password_hash, ...rest } = user;
  return {
    ...rest,
    creditBalance: Number(rest.creditBalance),
  };
}

// ---------------------------------------------------------------------------
// POST /register
// ---------------------------------------------------------------------------

router.post(
  '/register',
  asyncHandler(async (req: Request, res: Response) => {
    // Validate input
    const result = registerSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password, contactName, companyName, phone, country } = result.data;

    // Check for existing user
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        contactName,
        companyName: companyName ?? null,
        phone: phone ?? null,
        country: country ?? null,
      },
    });

    // Generate token
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  }),
);

// ---------------------------------------------------------------------------
// POST /login
// ---------------------------------------------------------------------------

router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = result.data;

    // Find user (include passwordHash for comparison)
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account has been deactivated. Please contact support.' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate token
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({
      token,
      user: sanitizeUser(user),
    });
  }),
);

// ---------------------------------------------------------------------------
// GET /me  (requires auth)
// ---------------------------------------------------------------------------

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
        stripeCustomerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        ...user,
        creditBalance: Number(user.creditBalance),
      },
    });
  }),
);

// ---------------------------------------------------------------------------
// PUT /me  (requires auth)
// ---------------------------------------------------------------------------

router.put(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = updateProfileSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { password, ...profileData } = result.data;

    // Build update payload – only include fields that were explicitly provided
    const updateData: Record<string, any> = {};

    if (profileData.contactName !== undefined) updateData.contactName = profileData.contactName;
    if (profileData.companyName !== undefined) updateData.companyName = profileData.companyName;
    if (profileData.phone !== undefined) updateData.phone = profileData.phone;
    if (profileData.country !== undefined) updateData.country = profileData.country;
    if (profileData.emailNotifications !== undefined)
      updateData.emailNotifications = profileData.emailNotifications;

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
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
        stripeCustomerId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      user: {
        ...updatedUser,
        creditBalance: Number(updatedUser.creditBalance),
      },
    });
  }),
);

// ---------------------------------------------------------------------------
// POST /refresh  (requires auth)
// ---------------------------------------------------------------------------

router.post(
  '/refresh',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    res.json({ token });
  }),
);

export default router;
