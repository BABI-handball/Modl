import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/src/lib/utils';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
      <select
        ref={ref}
        className={cn(
            // Très arrondi, moderne, focus beige
            'flex h-12 w-full rounded-2xl border-2 border-beige-200 bg-white px-4 py-3 pr-10 text-sm font-medium text-neutral-900 transition-all duration-200 appearance-none',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-beige-500/20 focus-visible:border-beige-500 focus-visible:shadow-lg focus-visible:shadow-beige-500/10',
            'hover:border-beige-300 hover:bg-beige-50/50',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-beige-50 disabled:border-beige-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
        {/* Icône de flèche personnalisée */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <svg
            className="h-5 w-5 text-neutral-400 transition-transform duration-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
