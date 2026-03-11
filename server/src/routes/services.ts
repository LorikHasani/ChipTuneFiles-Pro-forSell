import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler, toNumber } from '../utils/helpers';

/**
 * Converts Prisma Decimal fields in service categories/services to plain numbers
 * so they serialise correctly in JSON responses (SQL Server Decimals arrive as strings).
 */
function serializeCategories(categories: any[]): any[] {
  return categories.map((cat) => ({
    ...cat,
    services: (cat.services || []).map((svc: any) => ({
      ...svc,
      basePrice: toNumber(svc.basePrice),
      estimatedHours: svc.estimatedHours != null ? toNumber(svc.estimatedHours) : null,
    })),
  }));
}

const router = Router();

// ============================================
// GET / - List all active services grouped by category (public)
// ============================================
router.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ data: serializeCategories(categories) });
  })
);

// ============================================
// GET /all - List ALL services including inactive (admin only)
// ============================================
router.get(
  '/all',
  authenticate,
  requireAdmin,
  asyncHandler(async (_req: Request, res: Response) => {
    const categories = await prisma.serviceCategory.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    res.json({ data: serializeCategories(categories) });
  })
);

// ============================================
// POST / - Create service (admin only)
// ============================================
router.post(
  '/',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const {
      categoryId,
      code,
      name,
      description,
      basePrice,
      estimatedHours,
      icon,
      sortOrder,
      isActive,
    } = req.body;

    // Validate required fields
    if (!categoryId || !code || !name) {
      res.status(400).json({
        error: 'categoryId, code, and name are required.',
      });
      return;
    }

    // Verify category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    // Check for duplicate code
    const existingService = await prisma.service.findUnique({
      where: { code },
    });

    if (existingService) {
      res.status(409).json({
        error: `A service with code "${code}" already exists.`,
      });
      return;
    }

    const service = await prisma.service.create({
      data: {
        categoryId,
        code,
        name,
        description: description || null,
        basePrice: basePrice ?? 0,
        estimatedHours: estimatedHours ?? null,
        icon: icon || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: { category: true },
    });

    res.status(201).json({
      ...service,
      basePrice: toNumber(service.basePrice),
      estimatedHours: service.estimatedHours != null ? toNumber(service.estimatedHours) : null,
    });
  })
);

// ============================================
// PUT /:id - Update service (admin only)
// ============================================
router.put(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
      categoryId,
      code,
      name,
      description,
      basePrice,
      estimatedHours,
      icon,
      sortOrder,
      isActive,
    } = req.body;

    // Verify service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    // If changing code, check for duplicates
    if (code && code !== existingService.code) {
      const duplicateCode = await prisma.service.findUnique({
        where: { code },
      });
      if (duplicateCode) {
        res.status(409).json({
          error: `A service with code "${code}" already exists.`,
        });
        return;
      }
    }

    // If changing category, verify it exists
    if (categoryId && categoryId !== existingService.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        res.status(404).json({ error: 'Category not found.' });
        return;
      }
    }

    // Build update data with only provided fields
    const updateData: Record<string, any> = {};
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (estimatedHours !== undefined) updateData.estimatedHours = estimatedHours;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    res.json({
      ...service,
      basePrice: toNumber(service.basePrice),
      estimatedHours: service.estimatedHours != null ? toNumber(service.estimatedHours) : null,
    });
  })
);

// ============================================
// DELETE /:id - Deactivate service (soft delete, admin only)
// ============================================
router.delete(
  '/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      res.status(404).json({ error: 'Service not found.' });
      return;
    }

    await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Service deactivated successfully.' });
  })
);

// ============================================
// POST /categories - Create category (admin only)
// ============================================
router.post(
  '/categories',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { name, description, sortOrder, isActive, selectionType, jobType } =
      req.body;

    if (!name) {
      res.status(400).json({ error: 'Category name is required.' });
      return;
    }

    const category = await prisma.serviceCategory.create({
      data: {
        name,
        description: description || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
        selectionType: selectionType || 'MULTIPLE',
        jobType: jobType || 'ECU',
      },
    });

    res.status(201).json(category);
  })
);

// ============================================
// PUT /categories/:id - Update category (admin only)
// ============================================
router.put(
  '/categories/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, description, sortOrder, isActive, selectionType, jobType } =
      req.body;

    const existingCategory = await prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (selectionType !== undefined) updateData.selectionType = selectionType;
    if (jobType !== undefined) updateData.jobType = jobType;

    const category = await prisma.serviceCategory.update({
      where: { id },
      data: updateData,
    });

    res.json(category);
  })
);

// ============================================
// DELETE /categories/:id - Deactivate category (soft delete, admin only)
// ============================================
router.delete(
  '/categories/:id',
  authenticate,
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
    });

    if (!category) {
      res.status(404).json({ error: 'Category not found.' });
      return;
    }

    await prisma.serviceCategory.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({ message: 'Category deactivated successfully.' });
  })
);

export default router;
