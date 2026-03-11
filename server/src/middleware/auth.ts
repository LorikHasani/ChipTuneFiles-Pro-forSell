import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Extend Express Request to include user
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  contactName: string | null;
  companyName: string | null;
  phone: string | null;
  country: string | null;
  creditBalance: number;
  emailNotifications: boolean;
  isActive: boolean;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * JWT authentication middleware.
 * Extracts Bearer token from Authorization header, verifies it,
 * fetches the user from the database, and attaches to req.user.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Access denied. Invalid token format.' });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not defined in environment variables');
      res.status(500).json({ error: 'Server configuration error.' });
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (!user) {
      res.status(401).json({ error: 'User not found. Token may be invalid.' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Account has been deactivated.' });
      return;
    }

    // Convert Decimal to number for creditBalance
    req.user = {
      ...user,
      creditBalance: Number(user.creditBalance),
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token has expired. Please log in again.' });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

/**
 * Optional authentication middleware.
 * Attaches user to request if a valid token is present, but does not
 * reject the request if no token is provided.
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
      },
    });

    if (user && user.isActive) {
      req.user = {
        ...user,
        creditBalance: Number(user.creditBalance),
      };
    }
  } catch {
    // Silently ignore token errors for optional auth
  }

  next();
};

export default authenticate;
