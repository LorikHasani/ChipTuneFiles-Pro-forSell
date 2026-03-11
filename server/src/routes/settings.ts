import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../utils/helpers';

const router = Router();

/** Keys that are safe to expose publicly (no auth required). */
const PUBLIC_BRANDING_KEYS = [
  'brand_name',
  'logo_url',
  'primary_color',
  'accent_color',
  'contact_email',
  'currency_symbol',
];

// ---------------------------------------------------------------------------
// GET /branding - Get public branding settings (no auth)
// ---------------------------------------------------------------------------
router.get(
  '/branding',
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const settings = await prisma.setting.findMany({
      where: { key: { in: PUBLIC_BRANDING_KEYS } },
    });

    // Convert array to key-value map
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    res.json({ data: result });
  })
);

// ---------------------------------------------------------------------------
// GET / - Get all settings (admin only)
// ---------------------------------------------------------------------------
router.get(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: AuthRequest, res: Response) => {
    const settings = await prisma.setting.findMany();

    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }

    res.json({ data: result });
  })
);

// ---------------------------------------------------------------------------
// PUT / - Update settings (admin only)
// ---------------------------------------------------------------------------
router.put(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const settings = req.body;

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      res.status(400).json({ error: 'Request body must be an object of key-value pairs.' });
      return;
    }

    const entries = Object.entries(settings) as [string, unknown][];

    if (entries.length === 0) {
      res.status(400).json({ error: 'At least one setting key-value pair is required.' });
      return;
    }

    // Validate all values are strings
    for (const [key, value] of entries) {
      if (typeof value !== 'string') {
        res.status(400).json({ error: `Value for key "${key}" must be a string.` });
        return;
      }
    }

    // Upsert each setting inside a transaction
    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          create: { key, value: value as string },
          update: { value: value as string },
        })
      )
    );

    // Return all settings after update
    const allSettings = await prisma.setting.findMany();
    const result: Record<string, string> = {};
    for (const s of allSettings) {
      result[s.key] = s.value;
    }

    res.json({ data: result });
  })
);

export default router;
