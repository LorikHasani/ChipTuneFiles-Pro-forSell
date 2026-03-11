import { Request, Response, NextFunction } from 'express';

/**
 * Admin role check middleware.
 * Must be used after the authenticate middleware.
 * Checks that req.user.role is ADMIN or SUPERADMIN.
 * Returns 403 Forbidden if the user does not have admin privileges.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    return;
  }

  next();
};

/**
 * Superadmin role check middleware.
 * Must be used after the authenticate middleware.
 * Checks that req.user.role is SUPERADMIN.
 * Returns 403 Forbidden if the user is not a superadmin.
 */
export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'SUPERADMIN') {
    res.status(403).json({ error: 'Access denied. Superadmin privileges required.' });
    return;
  }

  next();
};

export default requireAdmin;
