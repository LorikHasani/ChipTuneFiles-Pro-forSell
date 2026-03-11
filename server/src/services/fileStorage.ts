import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Base uploads directory
const UPLOADS_BASE = path.resolve(__dirname, '../../uploads');

// Ensure base directory exists
if (!fs.existsSync(UPLOADS_BASE)) {
  fs.mkdirSync(UPLOADS_BASE, { recursive: true });
}

/**
 * File type subdirectory names for organized storage.
 */
const FILE_TYPE_DIRS: Record<string, string> = {
  ORIGINAL: 'original',
  MODIFIED: 'modified',
  original: 'original',
  modified: 'modified',
};

/**
 * Save a file to the organized directory structure: uploads/{jobId}/{fileType}/
 *
 * @param jobId - The job ID to organize the file under
 * @param file - The multer file object (or object with path, originalname)
 * @param fileType - The type of file ('ORIGINAL' or 'MODIFIED')
 * @returns The relative storage path from the uploads directory
 */
export async function saveFile(
  jobId: string,
  file: { path: string; originalname: string },
  fileType: string
): Promise<string> {
  const typeDir = FILE_TYPE_DIRS[fileType] || 'other';
  const targetDir = path.join(UPLOADS_BASE, jobId, typeDir);

  // Create directory structure if it does not exist
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Generate a unique filename while preserving the original extension
  const ext = path.extname(file.originalname);
  const uniqueFilename = `${uuidv4()}${ext}`;
  const targetPath = path.join(targetDir, uniqueFilename);

  // Move the file from multer temp location to organized directory
  await fs.promises.copyFile(file.path, targetPath);

  // Remove the original temp file
  try {
    await fs.promises.unlink(file.path);
  } catch {
    // Ignore error if temp file already removed
  }

  // Return relative path from uploads base (e.g., "{jobId}/original/{uuid}.bin")
  const relativePath = path.relative(UPLOADS_BASE, targetPath).replace(/\\/g, '/');
  return relativePath;
}

/**
 * Delete a file from storage by its relative storage path.
 *
 * @param storagePath - The relative storage path (e.g., "{jobId}/original/{uuid}.bin")
 * @returns true if the file was deleted, false if it did not exist
 */
export async function deleteFile(storagePath: string): Promise<boolean> {
  const absolutePath = path.join(UPLOADS_BASE, storagePath);

  try {
    await fs.promises.access(absolutePath, fs.constants.F_OK);
    await fs.promises.unlink(absolutePath);

    // Try to clean up empty parent directories
    const parentDir = path.dirname(absolutePath);
    try {
      const entries = await fs.promises.readdir(parentDir);
      if (entries.length === 0) {
        await fs.promises.rmdir(parentDir);

        // Also try to remove the job directory if empty
        const jobDir = path.dirname(parentDir);
        const jobEntries = await fs.promises.readdir(jobDir);
        if (jobEntries.length === 0) {
          await fs.promises.rmdir(jobDir);
        }
      }
    } catch {
      // Ignore directory cleanup errors
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the absolute filesystem path for a stored file.
 *
 * @param storagePath - The relative storage path (e.g., "{jobId}/original/{uuid}.bin")
 * @returns The absolute filesystem path
 */
export function getFilePath(storagePath: string): string {
  return path.resolve(UPLOADS_BASE, storagePath);
}

/**
 * Check if a file exists in storage.
 *
 * @param storagePath - The relative storage path
 * @returns true if the file exists
 */
export async function fileExists(storagePath: string): Promise<boolean> {
  const absolutePath = path.join(UPLOADS_BASE, storagePath);
  try {
    await fs.promises.access(absolutePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file size in bytes.
 *
 * @param storagePath - The relative storage path
 * @returns The file size in bytes, or 0 if file does not exist
 */
export async function getFileSize(storagePath: string): Promise<number> {
  const absolutePath = path.join(UPLOADS_BASE, storagePath);
  try {
    const stats = await fs.promises.stat(absolutePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Delete all files associated with a job.
 *
 * @param jobId - The job ID whose files to delete
 * @returns true if the directory was cleaned up
 */
export async function deleteJobFiles(jobId: string): Promise<boolean> {
  const jobDir = path.join(UPLOADS_BASE, jobId);

  try {
    await fs.promises.access(jobDir, fs.constants.F_OK);
    await fs.promises.rm(jobDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the uploads base directory path.
 */
export function getUploadsBasePath(): string {
  return UPLOADS_BASE;
}

export default {
  saveFile,
  deleteFile,
  getFilePath,
  fileExists,
  getFileSize,
  deleteJobFiles,
  getUploadsBasePath,
};
