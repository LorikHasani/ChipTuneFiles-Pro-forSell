import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import { saveFile, getFilePath, fileExists } from '../services/fileStorage';
import { asyncHandler } from '../utils/helpers';
import path from 'path';

const router = Router();

// ============================================
// POST /upload/:jobId - Upload file to a job
// ============================================
router.post(
  '/upload/:jobId',
  authenticate,
  uploadSingle,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;
    const user = req.user!;

    // Validate that a file was provided
    if (!req.file) {
      res.status(400).json({ error: 'No file provided.' });
      return;
    }

    // Validate fileType
    const fileType = req.body.fileType?.toUpperCase();
    if (!fileType || !['ORIGINAL', 'MODIFIED'].includes(fileType)) {
      res.status(400).json({
        error: 'Invalid fileType. Must be "original" or "modified".',
      });
      return;
    }

    // Find the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        clientId: true,
        referenceNumber: true,
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found.' });
      return;
    }

    const isAdmin =
      user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Authorization checks based on role and file type
    if (!isAdmin) {
      // Clients can only upload to their own jobs
      if (job.clientId !== user.id) {
        res.status(403).json({
          error: 'You can only upload files to your own jobs.',
        });
        return;
      }

      // Clients can only upload ORIGINAL files
      if (fileType !== 'ORIGINAL') {
        res.status(403).json({
          error: 'Clients can only upload original files.',
        });
        return;
      }
    }

    // Save file to organized storage
    const storagePath = await saveFile(jobId, req.file, fileType);

    // Create File record in database
    const file = await prisma.file.create({
      data: {
        jobId,
        fileType,
        originalName: req.file.originalname,
        storagePath,
        fileSize: req.file.size,
        uploadedBy: user.id,
      },
    });

    res.status(201).json({
      id: file.id,
      jobId: file.jobId,
      fileType: file.fileType,
      originalName: file.originalName,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
    });
  })
);

// ============================================
// GET /download/:fileId - Download a file
// ============================================
router.get(
  '/download/:fileId',
  authenticate,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fileId } = req.params;
    const user = req.user!;

    // Find the file with its associated job
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        job: {
          select: {
            id: true,
            clientId: true,
          },
        },
      },
    });

    if (!file) {
      res.status(404).json({ error: 'File not found.' });
      return;
    }

    const isAdmin =
      user.role === 'ADMIN' || user.role === 'SUPERADMIN';

    // Clients can only download files from their own jobs
    if (!isAdmin && file.job.clientId !== user.id) {
      res.status(403).json({
        error: 'You can only download files from your own jobs.',
      });
      return;
    }

    // Verify the file exists on disk
    const exists = await fileExists(file.storagePath);
    if (!exists) {
      res.status(404).json({ error: 'File not found on disk.' });
      return;
    }

    // Get the absolute path and stream the file
    const absolutePath = getFilePath(file.storagePath);

    // Set Content-Disposition header with the original filename
    const sanitizedFilename = file.originalName.replace(/[^\w.\-]/g, '_');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${sanitizedFilename}"`
    );

    res.download(absolutePath, file.originalName, (err) => {
      if (err) {
        // Only send error if headers haven't been sent yet
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download file.' });
        }
      }
    });
  })
);

export default router;
