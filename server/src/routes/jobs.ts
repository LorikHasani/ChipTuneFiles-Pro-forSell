import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import {
  asyncHandler,
  generateReferenceNumber,
  parsePagination,
  paginatedResponse,
  toNumber,
} from '../utils/helpers';
import { notify } from '../lib/notify';

const router = Router();

// Valid enum values (SQL Server uses strings instead of native enums)
const JOB_TYPES = ['ECU', 'TCU'] as const;
const JOB_STATUSES = ['PENDING', 'IN_PROGRESS', 'WAITING_FOR_INFO', 'COMPLETED', 'REVISION_REQUESTED', 'REJECTED'] as const;

// All job routes require authentication
router.use(authenticate);

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createJobSchema = z.object({
  jobType: z.enum(JOB_TYPES).default('ECU'),
  brand: z.string().max(100).trim().optional().nullable(),
  model: z.string().max(100).trim().optional().nullable(),
  year: z.number().int().min(1900).max(2100).optional().nullable(),
  engineType: z.string().max(100).trim().optional().nullable(),
  powerHp: z.number().int().min(0).max(10000).optional().nullable(),
  ecuType: z.string().max(100).trim().optional().nullable(),
  gearboxType: z.string().max(100).trim().optional().nullable(),
  vin: z.string().max(50).trim().optional().nullable(),
  mileage: z.number().int().min(0).optional().nullable(),
  fuelType: z.string().max(50).trim().optional().nullable(),
  clientNotes: z.string().max(5000).trim().optional().nullable(),
  readingTool: z.string().max(100).trim().optional().nullable(),
  toolType: z.string().max(100).trim().optional().nullable(),
  isOriginal: z.boolean().default(true),
  carNotes: z.string().max(5000).trim().optional().nullable(),
  serviceIds: z
    .array(z.string().min(1, 'Service ID cannot be empty'))
    .min(1, 'At least one service must be selected'),
});

const updateStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
  adminNotes: z.string().max(5000).trim().optional().nullable(),
});

const assignAdminSchema = z.object({
  adminId: z.string().uuid('Admin ID must be a valid UUID'),
});

const revisionSchema = z.object({
  reason: z
    .string()
    .min(1, 'Revision reason is required')
    .max(5000, 'Reason must be 5000 characters or fewer')
    .trim(),
});

// ---------------------------------------------------------------------------
// Shared includes
// ---------------------------------------------------------------------------

const jobListIncludes = {
  services: {
    include: {
      service: {
        select: {
          id: true,
          code: true,
          name: true,
          basePrice: true,
          icon: true,
        },
      },
    },
  },
  files: {
    select: {
      id: true,
      fileType: true,
      originalName: true,
      fileSize: true,
      createdAt: true,
    },
  },
  client: {
    select: {
      id: true,
      email: true,
      contactName: true,
      companyName: true,
      country: true,
    },
  },
  assignedAdmin: {
    select: {
      id: true,
      email: true,
      contactName: true,
    },
  },
};

/**
 * Converts Prisma Decimal fields in a job record to plain numbers
 * so they serialise correctly in JSON responses.
 */
function serializeJob(job: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {
    ...job,
    totalPrice: toNumber(job.totalPrice),
    creditsUsed: toNumber(job.creditsUsed),
  };

  if (job.services) {
    result.services = job.services.map((js: any) => ({
      ...js,
      price: toNumber(js.price),
      service: js.service
        ? { ...js.service, basePrice: toNumber(js.service.basePrice) }
        : undefined,
    }));
  }

  return result;
}

// ---------------------------------------------------------------------------
// GET / - List jobs
// ---------------------------------------------------------------------------

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const { skip, take, page, limit } = parsePagination(req.query);

    // Build where clause based on role
    const where: Record<string, any> = {};

    if (user.role === 'CLIENT') {
      // Clients can only see their own jobs
      where.clientId = user.id;
    }

    // All roles can filter by status
    const statusFilter = req.query.status as string | undefined;
    if (statusFilter && (JOB_STATUSES as readonly string[]).includes(statusFilter)) {
      where.status = statusFilter;
    }

    // Optional search by reference number
    const search = req.query.search as string | undefined;
    if (search && search.trim().length > 0) {
      where.referenceNumber = { contains: search.trim() };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: jobListIncludes,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.job.count({ where }),
    ]);

    const serialized = jobs.map(serializeJob);

    res.json(paginatedResponse(serialized, total, page, limit));
  }),
);

// ---------------------------------------------------------------------------
// POST / - Create job with services
// ---------------------------------------------------------------------------

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;

    // Validate input
    const result = createJobSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { serviceIds, ...jobData } = result.data;

    // Fetch requested services and verify they exist and are active
    const services = await prisma.service.findMany({
      where: {
        id: { in: serviceIds },
        isActive: true,
      },
    });

    if (services.length !== serviceIds.length) {
      const foundIds = new Set(services.map((s) => s.id));
      const missingIds = serviceIds.filter((id) => !foundIds.has(id));
      res.status(400).json({
        error: 'One or more selected services are invalid or inactive.',
        missingServiceIds: missingIds,
      });
      return;
    }

    // Calculate total price
    const totalPrice = services.reduce((sum, s) => sum + toNumber(s.basePrice), 0);

    // Check credit balance
    const currentBalance = toNumber(
      (await prisma.user.findUnique({
        where: { id: user.id },
        select: { creditBalance: true },
      }))?.creditBalance,
    );

    if (currentBalance < totalPrice) {
      res.status(402).json({
        error: 'Insufficient credits.',
        required: totalPrice,
        available: currentBalance,
      });
      return;
    }

    // Generate a unique reference number (retry on the very unlikely collision)
    let referenceNumber = generateReferenceNumber();
    const existing = await prisma.job.findUnique({ where: { referenceNumber } });
    if (existing) {
      referenceNumber = generateReferenceNumber();
    }

    // Execute everything inside a transaction
    const job = await prisma.$transaction(async (tx) => {
      // 1. Create the job
      const createdJob = await tx.job.create({
        data: {
          referenceNumber,
          clientId: user.id,
          jobType: jobData.jobType,
          brand: jobData.brand ?? null,
          model: jobData.model ?? null,
          year: jobData.year ?? null,
          engineType: jobData.engineType ?? null,
          powerHp: jobData.powerHp ?? null,
          ecuType: jobData.ecuType ?? null,
          gearboxType: jobData.gearboxType ?? null,
          vin: jobData.vin ?? null,
          mileage: jobData.mileage ?? null,
          fuelType: jobData.fuelType ?? null,
          clientNotes: jobData.clientNotes ?? null,
          readingTool: jobData.readingTool ?? null,
          toolType: jobData.toolType ?? null,
          isOriginal: jobData.isOriginal,
          carNotes: jobData.carNotes ?? null,
          totalPrice,
          creditsUsed: totalPrice,
        },
      });

      // 2. Create job_services entries
      await tx.jobService.createMany({
        data: services.map((s) => ({
          jobId: createdJob.id,
          serviceId: s.id,
          serviceName: s.name,
          price: toNumber(s.basePrice),
        })),
      });

      // 3. Deduct credits from user
      const balanceBefore = currentBalance;
      const balanceAfter = currentBalance - totalPrice;

      await tx.user.update({
        where: { id: user.id },
        data: { creditBalance: balanceAfter },
      });

      // 4. Create transaction record
      await tx.transaction.create({
        data: {
          userId: user.id,
          jobId: createdJob.id,
          type: 'JOB_PAYMENT',
          amount: -totalPrice,
          balanceBefore,
          balanceAfter,
          description: `Payment for job ${referenceNumber}`,
        },
      });

      // Return the full job with relations
      return tx.job.findUnique({
        where: { id: createdJob.id },
        include: jobListIncludes,
      });
    });

    if (!job) {
      res.status(500).json({ error: 'Failed to create job.' });
      return;
    }

    // Notify all admins about the new job
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPERADMIN'] } },
      select: { id: true },
    });
    const clientName = user.contactName || user.companyName || user.email;
    for (const admin of admins) {
      notify(
        admin.id,
        `New job submitted — ${referenceNumber}`,
        `${clientName} submitted a new job.`,
        'JOB',
        job.id,
      );
    }

    res.status(201).json({ job: serializeJob(job) });
  }),
);

// ---------------------------------------------------------------------------
// GET /:id - Get job detail
// ---------------------------------------------------------------------------

router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const jobId = req.params.id as string;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        ...jobListIncludes,
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

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    // Authorization: clients can only view their own jobs
    if (user.role === 'CLIENT' && job.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // If the requester is a client, filter out internal messages
    const serialized = serializeJob(job);
    if (user.role === 'CLIENT' && serialized.messages) {
      serialized.messages = serialized.messages.filter(
        (m: any) => !m.isInternal,
      );
    }

    res.json({ job: serialized });
  }),
);

// ---------------------------------------------------------------------------
// PUT /:id/status - Update job status (admin only)
// ---------------------------------------------------------------------------

router.put(
  '/:id/status',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const jobId = req.params.id as string;

    const result = updateStatusSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { status, adminNotes } = result.data;

    // Verify job exists
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    // Build update data
    const updateData: Record<string, any> = { status };

    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    // If the admin is changing status and the job is not yet assigned, assign it to themselves
    if (!existingJob.assignedAdminId) {
      updateData.assignedAdminId = user.id;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
      include: jobListIncludes,
    });

    // Notify the client about the status change
    const statusLabels: Record<string, string> = {
      PENDING: 'Pending',
      IN_PROGRESS: 'In Progress',
      WAITING_FOR_INFO: 'Waiting for Info',
      COMPLETED: 'Completed',
      REVISION_REQUESTED: 'Revision Requested',
      REJECTED: 'Rejected',
    };
    notify(
      existingJob.clientId,
      `Job ${existingJob.referenceNumber} — ${statusLabels[status] || status}`,
      `Your job has been updated to "${statusLabels[status] || status}".`,
      'JOB',
      jobId,
    );

    res.json({ job: serializeJob(updatedJob) });
  }),
);

// ---------------------------------------------------------------------------
// PUT /:id/assign - Assign admin to job (admin only)
// ---------------------------------------------------------------------------

router.put(
  '/:id/assign',
  requireAdmin,
  asyncHandler(async (req: Request, res: Response) => {
    const jobId = req.params.id as string;

    const result = assignAdminSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { adminId } = result.data;

    // Verify job exists
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (!existingJob) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    // Verify the target user is actually an admin
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, isActive: true },
    });

    if (!adminUser) {
      res.status(404).json({ error: 'Admin user not found.' });
      return;
    }

    if (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPERADMIN') {
      res.status(400).json({ error: 'Target user is not an admin.' });
      return;
    }

    if (!adminUser.isActive) {
      res.status(400).json({ error: 'Target admin account is deactivated.' });
      return;
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: { assignedAdminId: adminId },
      include: jobListIncludes,
    });

    res.json({ job: serializeJob(updatedJob) });
  }),
);

// ---------------------------------------------------------------------------
// POST /:id/revision - Request revision (client only)
// ---------------------------------------------------------------------------

router.post(
  '/:id/revision',
  asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const jobId = req.params.id as string;

    // Only clients can request revisions
    if (user.role !== 'CLIENT') {
      res.status(403).json({ error: 'Only clients can request revisions.' });
      return;
    }

    const result = revisionSchema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { reason } = result.data;

    // Verify job exists and belongs to this client
    const existingJob = await prisma.job.findUnique({ where: { id: jobId } });

    if (!existingJob) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    if (existingJob.clientId !== user.id) {
      res.status(403).json({ error: 'Access denied.' });
      return;
    }

    // Only allow revision requests on completed jobs
    if (existingJob.status !== 'COMPLETED') {
      res.status(400).json({
        error: 'Revisions can only be requested for completed jobs.',
      });
      return;
    }

    // Use a transaction to update the job and create a message atomically
    const updatedJob = await prisma.$transaction(async (tx) => {
      // Update job status and increment revision count
      const job = await tx.job.update({
        where: { id: jobId },
        data: {
          status: 'REVISION_REQUESTED',
          revisionCount: { increment: 1 },
        },
        include: jobListIncludes,
      });

      // Create a message recording the revision request reason
      await tx.jobMessage.create({
        data: {
          jobId,
          senderId: user.id,
          message: `Revision requested: ${reason}`,
          isInternal: false,
        },
      });

      return job;
    });

    // Notify assigned admin about the revision request
    if (existingJob.assignedAdminId) {
      notify(
        existingJob.assignedAdminId,
        `Revision requested — ${existingJob.referenceNumber}`,
        `Client requested a revision: ${reason}`,
        'JOB',
        jobId,
      );
    }

    res.json({ job: serializeJob(updatedJob) });
  }),
);

export default router;
