import { Request, Response, NextFunction } from 'express';

/**
 * Generate a unique reference number for tuning jobs.
 * Format: TUN-YYYYMMDD-XXXX where XXXX is a random 4-digit number.
 *
 * @returns A formatted reference number string
 */
export function generateReferenceNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const random = String(Math.floor(1000 + Math.random() * 9000)); // 4-digit random

  return `TUN-${year}${month}${day}-${random}`;
}

/**
 * Wraps an async Express route handler to automatically catch errors
 * and pass them to the next() error handler.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }));
 *
 * @param fn - An async function that handles the route
 * @returns A wrapped function that catches rejected promises
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Format a number as a currency string.
 *
 * @param amount - The numeric amount to format
 * @param currency - The currency code (default: 'EUR')
 * @param locale - The locale for formatting (default: 'en-US')
 * @returns A formatted currency string (e.g., "EUR 50.00")
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Paginate query results.
 * Parses page and limit from query parameters with sensible defaults.
 *
 * @param query - The Express request query object
 * @returns An object with skip, take, page, and limit for Prisma queries
 */
export function parsePagination(query: Record<string, any>): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const page = Math.max(1, parseInt(query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

/**
 * Build a paginated response object.
 *
 * @param data - The array of items for the current page
 * @param total - The total count of all matching items
 * @param page - The current page number
 * @param limit - The number of items per page
 * @returns A structured pagination response
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  };
}

/**
 * Sanitize a string for safe use in database queries.
 * Removes or escapes potentially dangerous characters.
 *
 * @param input - The raw input string
 * @returns A sanitized string
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .trim();
}

/**
 * Convert a Prisma Decimal value to a JavaScript number.
 *
 * @param value - A Prisma Decimal, string, number, or null
 * @returns The numeric value, or 0 if null/undefined
 */
export function toNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

/**
 * Delay execution for a specified number of milliseconds.
 * Useful for rate limiting or retry logic.
 *
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Truncate a string to a maximum length with an ellipsis.
 *
 * @param str - The input string
 * @param maxLength - Maximum allowed length (default: 100)
 * @returns The truncated string
 */
export function truncate(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

export default {
  generateReferenceNumber,
  asyncHandler,
  formatCurrency,
  parsePagination,
  paginatedResponse,
  sanitizeString,
  toNumber,
  delay,
  truncate,
};
