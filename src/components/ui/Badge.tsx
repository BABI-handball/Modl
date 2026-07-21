import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'secondary';
}

export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Très arrondi, moderne avec ombre subtile
          'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold',
          'transition-all duration-300 ease-out',
          'shadow-[0_1px_2px_rgba(0,0,0,0.05)]',
          {
            'bg-beige-200 text-neutral-800': variant === 'default',
            'bg-green-100 text-green-800 shadow-[0_1px_2px_rgba(34,197,94,0.1)]': variant === 'success',
            'bg-yellow-100 text-yellow-800 shadow-[0_1px_2px_rgba(245,158,11,0.1)]': variant === 'warning',
            'bg-red-100 text-red-800 shadow-[0_1px_2px_rgba(239,68,68,0.1)]': variant === 'danger',
            'bg-beige-500 text-white shadow-[0_2px_4px_rgba(176,176,140,0.25)]': variant === 'primary',
            'bg-beige-300 text-neutral-900': variant === 'secondary',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';
