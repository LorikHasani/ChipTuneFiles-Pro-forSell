import { type ClassValue, clsx } from 'clsx';

// Simple classnames merge (no clsx dependency needed)
export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatCurrency(amount: number | string, symbol = '\u20AC'): string {
  return `${symbol}${Number(amount).toFixed(2)}`;
}

export function formatCredits(amount: number | string): string {
  return `${Number(amount).toFixed(0)} credits`;
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    IN_PROGRESS: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    WAITING_FOR_INFO: 'bg-orange-100/80 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
    COMPLETED: 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    REVISION_REQUESTED: 'bg-violet-100/80 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
    REJECTED: 'bg-red-100/80 text-red-700 dark:bg-red-500/10 dark:text-red-400',
    OPEN: 'bg-blue-100/80 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
    IN_PROGRESS_TICKET: 'bg-amber-100/80 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
    CLOSED: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Pending',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_INFO: 'Waiting for Info',
    COMPLETED: 'Completed',
    REVISION_REQUESTED: 'Revision Requested',
    REJECTED: 'Rejected',
    OPEN: 'Open',
    CLOSED: 'Closed',
  };
  return labels[status] || status;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
