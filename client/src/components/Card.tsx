import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
}

export default function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/80 dark:border-neutral-800',
        className
      )}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-sm text-neutral-500">
                {subtitle}
              </p>
            )}
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
