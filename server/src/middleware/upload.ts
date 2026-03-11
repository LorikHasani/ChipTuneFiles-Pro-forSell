import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Base upload directory
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Max file size from env variable (default 50MB)
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '52428800', 10);

/**
 * Multer disk storage configuration.
 * Files are stored in server/uploads with unique filenames generated via uuid.
 * Original file extension is preserved.
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  },
});

/**
 * File filter to validate uploaded files.
 * Accepts common ECU tuning file types and general binary files.
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow common ECU tuning file extensions and general binary files
  const allowedExtensions = [
    '.bin', '.ori', '.mod', '.hex', '.s19', '.a2l',
    '.map', '.csv', '.zip', '.rar', '.7z', '.tar', '.gz',
    '.pdf', '.txt', '.jpg', '.jpeg', '.png', '.gif',
    '.doc', '.docx', '.xls', '.xlsx',
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  // Allow if extension is in whitelist or if no extension (binary files)
  if (allowedExtensions.includes(ext) || ext === '') {
    cb(null, true);
  } else {
    cb(null, true); // Accept all files for ECU tuning flexibility
  }
};

/**
 * Standard file upload middleware.
 * Accepts a single file with field name 'file'.
 */
export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).single('file');

/**
 * Multiple file upload middleware.
 * Accepts up to 10 files with field name 'files'.
 */
export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).array('files', 10);

/**
 * Upload middleware with custom field configuration.
 * Useful for routes that need both original and modified files.
 */
export const uploadFields = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
}).fields([
  { name: 'originalFile', maxCount: 1 },
  { name: 'modifiedFile', maxCount: 1 },
  { name: 'attachments', maxCount: 5 },
]);

/**
 * Creates a multer instance for a specific upload directory within uploads/.
 * Used when files need to be organized into subdirectories.
 */
export const createUploader = (subDir: string) => {
  const dir = path.join(UPLOADS_DIR, subDir);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const customStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${uuidv4()}${ext}`;
      cb(null, uniqueName);
    },
  });

  return multer({
    storage: customStorage,
    fileFilter,
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
  });
};

export default uploadSingle;
