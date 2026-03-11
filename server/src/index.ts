import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// Also try local .env
dotenv.config();

import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import jobRoutes from './routes/jobs';
import fileRoutes from './routes/files';
import serviceRoutes from './routes/services';
import creditRoutes from './routes/credits';
import messageRoutes from './routes/messages';
import ticketRoutes from './routes/tickets';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';
import settingRoutes from './routes/settings';

// Re-export prisma so existing imports from '../index' continue to work
export { prisma };

const app = express();
const PORT = process.env.PORT || 3000;

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Body parsing - raw body needed for Stripe webhook
app.use('/api/credits/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files (protected by auth in routes)
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/settings', settingRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientPath = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientPath, 'index.html'));
  });
}

// Error handling
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start
app.listen(PORT, () => {
  console.log(`ChipTuneFiles Pro server running on port ${PORT}`);
});

export default app;
